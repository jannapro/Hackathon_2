"""Agent runner — singleton MCP subprocess + stateless per-request Agent execution."""

import os
import sys
import logging

from agents import Agent, Runner
from agents.mcp import MCPServerStdio

from app.agent.prompts import make_prompt
from app.config import OPENAI_API_KEY, OPENAI_MODEL

logger = logging.getLogger(__name__)

# Set the API key for the openai-agents SDK
os.environ.setdefault("OPENAI_API_KEY", OPENAI_API_KEY)

# ---------- Singleton MCP server subprocess ----------

_mcp_server: MCPServerStdio | None = None


async def _start_mcp_server() -> MCPServerStdio:
    """Start a fresh MCP server subprocess."""
    server = MCPServerStdio(
        params={
            "command": sys.executable,  # same Python/venv as FastAPI
            "args": ["-m", "app.mcp_server.server"],
        },
        cache_tools_list=True,
    )
    await server.__aenter__()
    logger.info("MCP server subprocess started")
    return server


async def get_mcp_server() -> MCPServerStdio:
    """Return the singleton MCP server subprocess.

    If the subprocess has died or was never started, a new one is created.
    This makes the runner resilient to subprocess crashes.
    """
    global _mcp_server

    if _mcp_server is not None:
        # Check if the subprocess is still alive
        proc = getattr(_mcp_server, "_process", None)
        if proc is not None and proc.returncode is not None:
            # Subprocess has exited — clean up and restart
            logger.warning(
                "MCP subprocess exited with code %s — restarting", proc.returncode
            )
            try:
                await _mcp_server.__aexit__(None, None, None)
            except Exception:
                pass
            _mcp_server = None

    if _mcp_server is None:
        _mcp_server = await _start_mcp_server()

    return _mcp_server


async def shutdown_mcp_server() -> None:
    """Gracefully shut down the MCP subprocess. Call from FastAPI lifespan on exit."""
    global _mcp_server
    if _mcp_server is not None:
        try:
            await _mcp_server.__aexit__(None, None, None)
        except Exception:
            pass
        _mcp_server = None
        logger.info("MCP server subprocess stopped")


# ---------- Stateless agent runner ----------

async def run_agent(user_id: str, history: list[dict], new_message: str) -> str:
    """
    Create a fresh Agent per request, run it with full conversation history,
    and return the natural-language response string.

    If the MCP server subprocess has crashed, it is automatically restarted
    before the request is processed.

    Args:
        user_id:     Verified user ID from the session token (injected server-side).
        history:     Previous messages as [{"role": "user"|"assistant", "content": "..."}].
        new_message: The current user message to process.

    Returns:
        The agent's natural-language reply as a plain string.
    """
    server = await get_mcp_server()

    # make_prompt injects the verified user_id so the agent always passes it
    # to every MCP tool call — never sourced from the user's message.
    agent = Agent(
        name="TaskFlowAssistant",
        model=OPENAI_MODEL,
        instructions=make_prompt(user_id),
        mcp_servers=[server],
    )

    input_messages = history + [{"role": "user", "content": new_message}]

    try:
        result = await Runner.run(agent, input=input_messages)
    except Exception as exc:
        # If the agent run itself fails (e.g. MCP pipe broken mid-request),
        # tear down the server so the next request gets a fresh subprocess.
        logger.exception("Agent run failed: %s — resetting MCP server", exc)
        global _mcp_server
        try:
            if _mcp_server is not None:
                await _mcp_server.__aexit__(None, None, None)
        except Exception:
            pass
        _mcp_server = None
        raise

    output = result.final_output
    return str(output) if output is not None else "Sorry, I couldn't generate a response."

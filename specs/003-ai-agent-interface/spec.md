# Feature Specification: Conversational AI Agent Interface

**Feature Branch**: `003-ai-agent-interface`
**Created**: 2026-02-17
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Natural Language Task Management (Priority: P1)

As a user, I want to manage my tasks by talking naturally so that I do not
have to fill out forms or click through menus.

A user types a plain-English message such as "add a task to review the
project proposal" or "mark my design review task as done" into the chat
input. The system understands the intent, executes the correct operation,
and responds with a natural-language confirmation.

**Why this priority**: This is the core value proposition of the entire
feature. Without it, the AI interface provides no value. Every other story
depends on this working correctly.

**Independent Test**: Open the chat panel, type "add a task called buy
groceries" and verify a new task appears in the task list with the correct
title. No form interaction required.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the dashboard, **When** they type "add a
   task to finish the report by Friday", **Then** a new task titled
   "Finish the report by Friday" is created and the agent replies
   confirming the action.
2. **Given** a user with existing tasks, **When** they type "show me all
   my tasks", **Then** the agent lists their tasks in a readable format
   in the chat.
3. **Given** a user with a pending task, **When** they type "mark my
   grocery task as complete", **Then** that task's status changes to
   completed and the agent confirms.
4. **Given** a user with a pending task, **When** they type "delete the
   report task", **Then** the task is removed and the agent confirms
   deletion.
5. **Given** a user with a pending task, **When** they type "update the
   report task to include a subtitle section", **Then** the task
   description is updated and the agent confirms.
6. **Given** a user types an ambiguous or unrecognised command, **Then**
   the agent asks for clarification rather than performing a wrong action.

---

### User Story 2 — Conversational Context (Priority: P2)

As a user, I want the agent to remember what we just talked about within
the same conversation so that I can refer to tasks by context without
repeating myself.

A user can say "delete it" after previously discussing a specific task and
the agent understands which task "it" refers to. The full conversation
history from all prior turns drives this context.

**Why this priority**: Without conversational context, users must repeat
task names in every message, defeating the purpose of a chat interface.
This elevates the experience from a command parser to a real assistant.

**Independent Test**: Send two messages in sequence — first "add a task
called clean the kitchen", then "delete it". Verify the second message
correctly deletes the task created in the first message without the user
specifying the task name again.

**Acceptance Scenarios**:

1. **Given** the agent just confirmed creating a task called "clean the
   kitchen", **When** the user sends "actually delete it", **Then** the
   agent deletes that task and confirms, without requiring the user to
   repeat the task name.
2. **Given** the agent listed three tasks in the previous message, **When**
   the user says "complete the second one", **Then** the agent completes
   the correct task.
3. **Given** a user starts a new chat session, **When** they refer to a
   task from a previous session (e.g. "that task I mentioned before"),
   **Then** the agent has access to the stored conversation history and
   can attempt to resolve the reference.
4. **Given** a long conversation, **When** the user asks about a task
   mentioned many messages ago, **Then** the agent still resolves it
   correctly because the full history is always loaded on every request.

---

### User Story 3 — Chat UI Alongside Existing Dashboard (Priority: P3)

As a user, I want the chat interface to sit alongside my existing task
dashboard so that I can use either the chat or the forms — whichever
suits the moment — and always see the same task state.

The chat panel is embedded in the dashboard. Users can add a task via the
existing "Add Task" button or by chatting — both reflect in the same task
list in real time.

**Why this priority**: The AI chat is an enhancement, not a replacement.
The existing web UI must continue working. This story validates seamless
coexistence between both interaction modes.

**Independent Test**: Add a task through the chat, then verify it appears
immediately in the task card grid without a page refresh. Add a task
through the form, then ask the agent to list all tasks and verify the
form-created task is included in the response.

**Acceptance Scenarios**:

1. **Given** the dashboard is open, **When** the user creates a task via
   chat, **Then** the task card grid updates to show the new task without
   a page reload.
2. **Given** the user created a task via the form UI, **When** they ask
   the agent "show me all my tasks", **Then** the agent includes the
   form-created task in its response.
3. **Given** the user deletes a task via chat, **When** they view the
   task grid, **Then** the deleted task is no longer displayed.

---

### Edge Cases

- What happens when the user sends an empty or whitespace-only message?
- What happens when the user asks the agent to delete a task that does
  not exist?
- What happens when the agent cannot determine which task the user is
  referring to (ambiguous pronoun or ordinal reference)?
- What happens when the user asks the agent to do something completely
  outside task management (e.g. "what is the weather today?")?
- What happens if the conversation history grows very long and approaches
  the AI model's context limit?
- What happens when the user sends the same add-task command twice
  in a row?

---

## Requirements *(mandatory)*

### Functional Requirements

**Natural Language Task Management**

- **FR-001**: The system MUST accept free-form natural-language text
  messages from authenticated users and interpret them as task management
  intents (add, list, update, complete, delete).
- **FR-002**: The system MUST map recognised intents to exactly one of
  five operations: add task, list tasks, update task, complete task,
  delete task.
- **FR-003**: The system MUST return a natural-language confirmation
  message to the user after every successful operation.
- **FR-004**: The system MUST return a natural-language error or
  clarification message when the intent cannot be determined or the
  requested operation fails.

**Conversational Context**

- **FR-005**: The system MUST persist every user message and every agent
  response to a durable conversation history store, linked to the
  authenticated user.
- **FR-006**: On every chat request, the system MUST load the full
  conversation history for the authenticated user and provide it to the
  agent before processing the new message.
- **FR-007**: The agent MUST use the loaded conversation history to
  resolve contextual references (pronouns, ordinals, prior task names)
  in the current message.
- **FR-008**: Conversation history MUST be scoped per user. A user MUST
  NOT be able to read or influence another user's conversation history.

**MCP Tool Surface**

- **FR-009**: The system MUST expose exactly five task-management tools
  accessible to the agent: `add_task`, `list_tasks`, `complete_task`,
  `update_task`, `delete_task`.
- **FR-010**: Each MCP tool MUST accept a `user_id` parameter and scope
  all data operations to that user exclusively.
- **FR-011**: Each MCP tool MUST return a structured, readable result
  that the agent can incorporate into its natural-language response.
- **FR-012**: The agent MUST NOT perform any data operation directly.
  All task reads and writes MUST route through the five MCP tools.

**Stateless Request Lifecycle**

- **FR-013**: Every chat request MUST follow this five-step lifecycle:
  Fetch history → Hydrate agent context → Process new message →
  Persist agent response → Discard agent state.
- **FR-014**: The system MUST NOT retain agent state or in-memory
  conversation context between requests.

**Authentication and Security**

- **FR-015**: The chat endpoint MUST require an authenticated session.
  Unauthenticated requests MUST be rejected with an appropriate error.
- **FR-016**: The `user_id` supplied to each MCP tool MUST be derived
  exclusively from the server-side verified session token — it MUST NOT
  come from the message body or any client-supplied value.

### Key Entities

- **ChatMessage**: A single message in a conversation. Carries a role
  (user or assistant), text content, a timestamp, and a reference to the
  owning user. Messages are ordered chronologically within a user's history.
- **ConversationHistory**: The complete ordered collection of all
  ChatMessages for a given user. Fetched in full at the start of every
  agent request and appended to at the end of each request.
- **AgentRequest** *(transient)*: A per-request unit holding the new
  user message, the loaded history, and the verified `user_id`. Never
  persisted; discarded immediately after the response is returned.
- **Task** *(existing)*: Title, description, status, and user_id.
  Managed exclusively via MCP tools in the AI flow.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, list, update, complete, and delete tasks
  entirely through natural-language chat without interacting with any
  form UI.
- **SC-002**: The agent correctly resolves in-session contextual
  references (e.g. "delete it", "mark the second one done") in at least
  9 out of 10 follow-up messages during a single session.
- **SC-003**: The agent delivers a response in under 5 seconds for any
  standard single-tool task operation under normal load conditions.
- **SC-004**: Every chat request successfully loads and uses the user's
  full conversation history — no request processes without prior context
  being available to the agent.
- **SC-005**: No MCP tool operation can access or modify another user's
  tasks or conversation history under any circumstances.
- **SC-006**: All existing task form UI and task card grid functionality
  continues to work without regression after the chat interface is
  introduced.
- **SC-007**: Tasks created or modified via chat are immediately visible
  in the task card grid, and tasks created via the form are immediately
  queryable through the chat — both views reflect the same live state.

---

## Assumptions

- The AI model used by the Agents SDK has sufficient context window
  capacity for typical conversation lengths (up to approximately 50 turns
  per user). Truncation strategy is out of scope for this phase.
- The full conversation history is always loaded per request for the MVP.
  Pagination or summarisation of history will be addressed post-MVP only
  if context limits are hit in practice.
- A single conversation thread per user is assumed. Named conversations
  or multi-thread support are out of scope for this feature.
- The five MCP tools (add_task, list_tasks, complete_task, update_task,
  delete_task) cover all task operations required. Additional tools such
  as task search by keyword or priority setting are out of scope.
- The chat UI is rendered as a panel within the existing dashboard page.
  A dedicated standalone chat page is not required.
- Streaming responses (token-by-token display) are not required for the
  MVP — the full agent response is returned once complete.

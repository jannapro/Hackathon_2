"""Auth middleware — verify Better Auth session token via shared database."""

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session

security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_session),
) -> str:
    """Look up the Bearer token in Better Auth's session table.

    Returns user_id if the token is valid and not expired.
    Raises 401 if the token is missing, invalid, or expired.
    """
    token = credentials.credentials

    try:
        result = await db.execute(
            text('SELECT "userId", "expiresAt" FROM "session" WHERE "token" = :token'),
            {"token": token},
        )
        row = result.first()
    except Exception as e:
        print(f"[AUTH] DB lookup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    if row is None:
        print(f"[AUTH] No session found for token: {token[:20]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id, expires_at = row

    # Check expiration
    if expires_at:
        # Handle both naive and aware datetimes
        exp = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired",
            )

    print(f"[AUTH] Verified user: {user_id}")
    return user_id

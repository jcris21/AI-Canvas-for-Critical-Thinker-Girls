from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.config import settings
from app.db.database import get_session

bearer_scheme = HTTPBearer(auto_error=False)


async def get_db(session: AsyncSession = Depends(get_session)) -> AsyncSession:
    return session


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    In development: auth is bypassed.
    TODO: implement Clerk JWT verification for production.
    """
    if settings.app_env == "development":
        return {"sub": "dev_user", "tenant_id": "dev_tenant"}

    if not credentials:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    # TODO: verify Clerk JWT
    return {"sub": "user_placeholder", "tenant_id": "tenant_placeholder"}

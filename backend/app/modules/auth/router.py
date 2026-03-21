"""Auth module — identity is owned by Clerk. This router handles post-auth sync."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user_id

router = APIRouter()


@router.get("/me")
async def get_me(
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return the current authenticated user's Clerk ID."""
    return {"clerk_user_id": clerk_user_id}

"""Clerk JWT verification."""
import time

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

bearer_scheme = HTTPBearer()

_JWKS_TTL_SECONDS = 3600  # 1 hour

_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0.0


async def _get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at
    now = time.monotonic()
    if _jwks_cache is None or (now - _jwks_fetched_at) > _JWKS_TTL_SECONDS:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(settings.CLERK_JWKS_URL)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_fetched_at = now
    return _jwks_cache


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )


async def get_current_user_id(payload: dict = Depends(verify_token)) -> str:
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing subject in token")
    return user_id

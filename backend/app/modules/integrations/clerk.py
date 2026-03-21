"""Clerk webhook handler for user lifecycle events."""
import hashlib
import hmac

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.core.config import settings

router = APIRouter()


def _verify_clerk_signature(payload: bytes, svix_signature: str, svix_timestamp: str) -> bool:
    msg = f"{svix_timestamp}.{payload.decode()}".encode()
    secret = settings.CLERK_SECRET_KEY.removeprefix("whsec_")
    import base64
    key = base64.b64decode(secret)
    expected = hmac.new(key, msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, svix_signature.split(",")[-1].removeprefix("v1="))


@router.post("/clerk/webhooks")
async def clerk_webhook(
    request: Request,
    svix_id: str = Header(..., alias="svix-id"),
    svix_timestamp: str = Header(..., alias="svix-timestamp"),
    svix_signature: str = Header(..., alias="svix-signature"),
) -> dict:
    payload = await request.body()

    if not _verify_clerk_signature(payload, svix_signature, svix_timestamp):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    event = await request.json()
    event_type: str = event.get("type", "")

    if event_type == "user.created":
        # Sync new Clerk user to local DB
        pass
    elif event_type == "user.deleted":
        # Soft-delete or cleanup
        pass

    return {"received": True}

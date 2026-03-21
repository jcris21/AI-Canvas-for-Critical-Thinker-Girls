from pydantic import EmailStr

from app.schemas.common import BaseResponse, BaseSchema


class UserCreate(BaseSchema):
    clerk_user_id: str
    email: EmailStr
    display_name: str | None = None
    avatar_url: str | None = None


class UserUpdate(BaseSchema):
    display_name: str | None = None
    avatar_url: str | None = None


class UserResponse(BaseResponse):
    clerk_user_id: str
    email: str
    display_name: str | None
    avatar_url: str | None

from app.models.tenant import TenantRole
from app.schemas.common import BaseResponse, BaseSchema


class TenantCreate(BaseSchema):
    name: str
    slug: str


class TenantResponse(BaseResponse):
    name: str
    slug: str


class AddMemberRequest(BaseSchema):
    clerk_user_id: str
    role: TenantRole = TenantRole.STUDENT

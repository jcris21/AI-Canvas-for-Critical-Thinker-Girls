import uuid

from app.models.lesson import AssetType
from app.schemas.common import BaseResponse, BaseSchema


class LessonCardCreate(BaseSchema):
    title: str
    body: str | None = None
    order: int = 0


class LessonAssetResponse(BaseResponse):
    asset_type: AssetType
    gcs_path: str
    filename: str


class LessonCreate(BaseSchema):
    title: str
    description: str | None = None
    cards: list[LessonCardCreate] = []


class LessonCardResponse(BaseResponse):
    title: str
    body: str | None
    order: int


class LessonResponse(BaseResponse):
    title: str
    description: str | None
    created_by: str
    cards: list[LessonCardResponse] = []
    assets: list[LessonAssetResponse] = []

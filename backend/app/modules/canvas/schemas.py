import uuid
from typing import Any

from app.schemas.common import BaseResponse, BaseSchema


class CanvasObjectData(BaseSchema):
    object_type: str
    fabric_data: dict[str, Any]
    draggable: bool = True
    deletable: bool = True
    locked: bool = False


class CanvasSceneUpdate(BaseSchema):
    snapshot: dict[str, Any] | None = None


class CanvasObjectResponse(BaseResponse):
    object_type: str
    fabric_data: dict[str, Any]
    draggable: bool
    deletable: bool
    locked: bool


class CanvasSceneResponse(BaseResponse):
    assigned_mission_id: uuid.UUID
    snapshot: dict[str, Any] | None
    objects: list[CanvasObjectResponse] = []

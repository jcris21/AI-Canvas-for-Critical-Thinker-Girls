import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user_id
from app.core.tenancy import resolve_tenant
from app.modules.lessons.schemas import LessonCreate, LessonResponse
from app.modules.lessons.service import LessonService

router = APIRouter()


@router.post("", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    body: LessonCreate,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> LessonResponse:
    svc = LessonService(db, tenant_id)
    lesson = await svc.create(body, clerk_user_id)
    return LessonResponse.model_validate(lesson)


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
) -> LessonResponse:
    svc = LessonService(db, tenant_id)
    lesson = await svc.get_with_relations(lesson_id)
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return LessonResponse.model_validate(lesson)

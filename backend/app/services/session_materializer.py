"""
Session Materializer — core flow: Author → Assign → Materialize → Execute

When a student starts a session, this service:
1. Fetches AssignedMission + MissionTemplate + Lesson + Assets
2. Creates ChatSession
3. Creates CanvasScene
4. Converts LessonAssets → CanvasObjects
"""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.canvas import CanvasObject, CanvasScene
from app.models.chat import ChatSession
from app.models.lesson import Lesson
from app.models.mission import AssignedMission, MissionStatus


class SessionMaterializer:
    def __init__(self, db: AsyncSession, tenant_id: uuid.UUID) -> None:
        self.db = db
        self.tenant_id = tenant_id

    async def materialize(
        self, assigned_mission_id: uuid.UUID, student_clerk_id: str
    ) -> tuple[ChatSession, CanvasScene]:
        assignment = await self._get_assignment(assigned_mission_id)
        lesson = await self._get_lesson(assignment.template.lesson_id)

        chat_session = await self._create_chat_session(assignment, student_clerk_id)
        canvas_scene = await self._create_canvas_scene(assignment, lesson)

        assignment.status = MissionStatus.IN_PROGRESS
        await self.db.flush()

        return chat_session, canvas_scene

    async def _get_assignment(self, assignment_id: uuid.UUID) -> AssignedMission:
        result = await self.db.execute(
            select(AssignedMission)
            .where(
                AssignedMission.id == assignment_id,
                AssignedMission.tenant_id == self.tenant_id,
            )
            .options(selectinload(AssignedMission.template))
        )
        assignment = result.scalar_one_or_none()
        if not assignment:
            raise ValueError(f"AssignedMission {assignment_id} not found")
        return assignment

    async def _get_lesson(self, lesson_id: uuid.UUID) -> Lesson:
        result = await self.db.execute(
            select(Lesson)
            .where(Lesson.id == lesson_id, Lesson.tenant_id == self.tenant_id)
            .options(selectinload(Lesson.assets))
        )
        lesson = result.scalar_one_or_none()
        if not lesson:
            raise ValueError(f"Lesson {lesson_id} not found")
        return lesson

    async def _create_chat_session(
        self, assignment: AssignedMission, student_clerk_id: str
    ) -> ChatSession:
        session = ChatSession(
            tenant_id=self.tenant_id,
            assigned_mission_id=assignment.id,
            student_clerk_id=student_clerk_id,
        )
        self.db.add(session)
        await self.db.flush()
        await self.db.refresh(session)
        return session

    async def _create_canvas_scene(
        self, assignment: AssignedMission, lesson: Lesson
    ) -> CanvasScene:
        scene = CanvasScene(
            tenant_id=self.tenant_id,
            assigned_mission_id=assignment.id,
        )
        self.db.add(scene)
        await self.db.flush()

        for asset in lesson.assets:
            obj = CanvasObject(
                tenant_id=self.tenant_id,
                scene_id=scene.id,
                object_type=asset.asset_type,
                fabric_data={
                    "type": "image",
                    "src": asset.gcs_path,  # frontend resolves to signed URL
                    "left": 100,
                    "top": 100,
                    "scaleX": 1,
                    "scaleY": 1,
                },
                draggable=True,
                deletable=True,
                locked=False,
            )
            self.db.add(obj)

        await self.db.flush()
        await self.db.refresh(scene)
        return scene

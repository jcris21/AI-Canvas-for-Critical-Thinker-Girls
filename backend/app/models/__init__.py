# Import all models here so Alembic can detect them via Base.metadata
from app.models.base import Base, BaseModel, TenantScopedModel  # noqa: F401
from app.models.tenant import Tenant, UserTenant  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.lesson import Lesson, LessonCard, LessonAsset  # noqa: F401
from app.models.mission import MissionTemplate, AssignedMission  # noqa: F401
from app.models.chat import ChatSession, ChatMessage  # noqa: F401
from app.models.canvas import CanvasScene, CanvasObject  # noqa: F401

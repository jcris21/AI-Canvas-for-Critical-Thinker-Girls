"""
Background worker setup (Celery with Redis broker).
For MVP, most operations are synchronous. Add tasks here as needed.
"""
from celery import Celery

from app.core.config import settings

# Redis URL expected in settings for production
BROKER_URL = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "wondercanvas",
    broker=BROKER_URL,
    backend=BROKER_URL,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

"""Celery tasks — placeholder for async jobs post-MVP."""
from app.workers.celery_app import celery_app


@celery_app.task
def notify_student_assigned(student_clerk_id: str, mission_title: str) -> None:
    """Notify student when a mission is assigned. Implement with email/push later."""
    pass


@celery_app.task
def cleanup_expired_sessions(days: int = 30) -> None:
    """Archive or delete sessions older than N days."""
    pass

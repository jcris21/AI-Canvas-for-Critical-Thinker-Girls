from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.ai.router import router as ai_router
from app.modules.auth.router import router as auth_router
from app.modules.canvas.router import router as canvas_router
from app.modules.chat.router import router as chat_router
from app.modules.files.router import router as files_router
from app.modules.lessons.router import router as lessons_router
from app.modules.missions.router import router as missions_router
from app.modules.tenants.router import router as tenants_router
from app.modules.users.router import router as users_router

app = FastAPI(
    title="WonderCanvas API",
    version="0.1.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api/v1"

app.include_router(auth_router, prefix=f"{API_V1}/auth", tags=["auth"])
app.include_router(users_router, prefix=f"{API_V1}/users", tags=["users"])
app.include_router(tenants_router, prefix=f"{API_V1}/tenants", tags=["tenants"])
app.include_router(lessons_router, prefix=f"{API_V1}/lessons", tags=["lessons"])
app.include_router(missions_router, prefix=f"{API_V1}/missions", tags=["missions"])
app.include_router(chat_router, prefix=f"{API_V1}/chat", tags=["chat"])
app.include_router(canvas_router, prefix=f"{API_V1}/canvas", tags=["canvas"])
app.include_router(files_router, prefix=f"{API_V1}/files", tags=["files"])
app.include_router(ai_router, prefix=f"{API_V1}/ai", tags=["ai"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}

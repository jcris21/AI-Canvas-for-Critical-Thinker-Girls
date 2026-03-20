from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.ai.router import router as ai_router
from app.modules.lessons.router import router as lessons_router
from app.modules.missions.router import router as missions_router
from app.modules.chat.router import router as chat_router
from app.modules.canvas.router import router as canvas_router
from app.modules.files.router import router as files_router

app = FastAPI(
    title="WonderCanvas API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router, prefix="/api/v1")
app.include_router(lessons_router, prefix="/api/v1")
app.include_router(missions_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(canvas_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}

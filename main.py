from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.vectorstore.qdrant_store import init_collection
from app.api.ingest import router as ingest_router
from app.api.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_collection()
    yield

#app basic sturcturing for FastAPI
app = FastAPI(
    title="Course AI",
    description="RAG-powered course assistant",
    version="1.0.0",
    lifespan=lifespan,
)

#Router inclusion for different endpoints
app.include_router(ingest_router, prefix="/ingest", tags=["Ingestion"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])


#
@app.get("/health")
async def health():
    return {"status": "ok"}

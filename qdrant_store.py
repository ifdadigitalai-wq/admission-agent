import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from app.config import get_settings
from app.embeddings.embedder import get_embedding_dim

settings = get_settings()

_client: Optional[AsyncQdrantClient] = None


def get_client() -> AsyncQdrantClient:
    global _client
    if _client is None:
        _client = AsyncQdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
        )
    return _client


async def init_collection():
    #Creating the Qdrant collection if it doesn't exist yet
    client = get_client()
    collections = await client.get_collections()
    names = [c.name for c in collections.collections]

    if settings.qdrant_collection not in names:
        await client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(
                size=get_embedding_dim(),
                distance=Distance.COSINE,
            ),
        )
        print(f"[qdrant] Created collection '{settings.qdrant_collection}'")
    else:
        print(f"[qdrant] Collection '{settings.qdrant_collection}' already exists")


async def upsert_chunks(
    texts: List[str],
    vectors: List[List[float]],
    metadatas: List[Dict[str, Any]],
):
    #Insert or update chunks in Qdrant.....
    client = get_client()
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={"text": text, **metadata},
        )
        for text, vector, metadata in zip(texts, vectors, metadatas)
    ]
    await client.upsert(
        collection_name=settings.qdrant_collection,
        points=points,
    )


async def search(
    query_vector: List[float],
    top_k: int = 5,
    course_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    client = get_client()
    query_filter = None
    if course_id:
        query_filter = Filter(
            must=[FieldCondition(key="course_id", match=MatchValue(value=course_id))]
        )

    results = await client.search(
        collection_name=settings.qdrant_collection,
        query_vector=query_vector,
        limit=top_k,
        query_filter=query_filter,
        with_payload=True,
    )

    return [
        {
            "text": r.payload.get("text", ""),
            "score": r.score,
            "metadata": {k: v for k, v in r.payload.items() if k != "text"},
        }
        for r in results
    ]

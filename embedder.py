from typing import List
from app.config import get_settings

settings = get_settings()

# Lazy-loaded to avoid import cost at startup
_local_model = None


def _get_local_model():
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        _local_model = SentenceTransformer(settings.local_embedding_model)
    return _local_model


def embed_local(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using a local sentence-transformers model."""
    model = _get_local_model()
    vectors = model.encode(texts, batch_size=64, show_progress_bar=False)
    return vectors.tolist()


async def embed_openai(texts: List[str]) -> List[List[float]]:
    """Generate embeddings via OpenAI API (batched)."""
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    BATCH = 100 
    all_vectors = []
    for i in range(0, len(texts), BATCH):
        batch = texts[i: i + BATCH]
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=batch,
        )
        all_vectors.extend([r.embedding for r in response.data])
    return all_vectors


async def embed_texts(texts: List[str]) -> List[List[float]]:
    if not texts:
        return []

    if settings.embedding_model == "openai":
        return await embed_openai(texts)
    else:
        return embed_local(texts)


def get_embedding_dim() -> int:
    dims = {
        "all-MiniLM-L6-v2": 384,
        "all-mpnet-base-v2": 768,
        "text-embedding-3-small": 1536,
        "text-embedding-3-large": 3072,
    }
    model = (
        settings.local_embedding_model
        if settings.embedding_model == "local"
        else "text-embedding-3-small"
    )
    return dims.get(model, 384)

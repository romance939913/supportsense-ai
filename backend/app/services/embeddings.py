from functools import lru_cache

from openai import OpenAI

from app.core.config import settings


EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
BATCH_SIZE = 50


@lru_cache
def _get_client() -> OpenAI:
    return OpenAI(api_key=settings.openai_api_key)


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    if any(not text.strip() for text in texts):
        raise ValueError("Embedding inputs cannot be empty")

    vectors: list[list[float]] = []

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]

        response = _get_client().embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch,
            dimensions=EMBEDDING_DIMENSIONS,
            encoding_format="float",
        )

        batch_results = sorted(response.data, key=lambda item: item.index)
        vectors.extend(item.embedding for item in batch_results)

    if len(vectors) != len(texts):
        raise RuntimeError("Embedding response count did not match input count")

    if any(len(vector) != EMBEDDING_DIMENSIONS for vector in vectors):
        raise RuntimeError("Embedding response had an unexpected dimension")

    return vectors
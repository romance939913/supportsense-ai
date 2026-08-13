from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.documents import router as documents_router


app = FastAPI(title="SupportSenseAI API")

app.include_router(health_router)
app.include_router(documents_router)


@app.get("/health")
def health():
    return {"status": "ok"}
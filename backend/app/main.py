from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.documents import router as documents_router
from app.api.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="SupportSenseAI API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",  # Included in case your browser maps it this way
]

# 2. Add the CORSMiddleware to your application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # List of allowed origins
    allow_credentials=True,         # Allow cookies/auth headers
    allow_methods=["*"],            # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],            # Allow all headers
)

app.include_router(health_router)
app.include_router(documents_router)
app.include_router(auth_router)


@app.get("/health")
def health():
    return {"status": "ok"}
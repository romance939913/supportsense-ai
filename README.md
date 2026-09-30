# SupportSenseAI

SupportSenseAI is an AI-powered customer support assistant that lets companies upload internal documentation and provide accurate, context-aware answers through Retrieval-Augmented Generation (RAG).

## Tech Stack

- Next.js
- FastAPI
- PostgreSQL
- pgvector
- Docker
- OpenAI

## Architecture

Frontend → FastAPI → PostgreSQL (pgvector)

## Local Development

### Prerequisites

- Docker
- Python 3.11+
- Node.js 20+

### 1. Start the database

From the repo root:

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with user `supportsense`, password `password`, and database `supportsense`.

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
POSTGRES_USER=supportsense
POSTGRES_PASSWORD=password
POSTGRES_DB=supportsense

DATABASE_URL=postgresql+psycopg://supportsense:password@localhost:5432/supportsense

JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Generate a real secret with `openssl rand -hex 32`.

Run migrations, create an admin user, and start the API:

```bash
alembic upgrade head
python -m app.scripts.create_admin
uvicorn app.main:app --reload
```

The API runs at http://127.0.0.1:8000 (interactive docs at http://127.0.0.1:8000/docs).

### 3. Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:3000. Log in with the admin account you created above.

## Status

🚧 In active development.
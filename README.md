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

### 1. Start the local services

First, from the repo root, create the Compose environment file and add your LocalStack developer token as `LOCALSTACK_AUTH_TOKEN=your-token`:

```bash
cp .env.example .env
```

Then start the services from the repo root:

```bash
docker compose up -d
```

This starts PostgreSQL and LocalStack. PostgreSQL is available at `localhost:5432` with user `supportsense`, password `password`, and database `supportsense`. LocalStack provides a local S3-compatible endpoint at `http://localhost:4566` and creates the `supportsense-documents-local` bucket on startup.

The current LocalStack Docker image requires an auth token. Get a developer token from the [LocalStack web app](https://app.localstack.cloud) and put it in the repo-root `.env` as `LOCALSTACK_AUTH_TOKEN=your-token`. Compose reads this file automatically and passes only that variable into LocalStack. Do not commit your token; `.env` is git-ignored.

Both services keep their data in Docker volumes, so uploaded local files and database rows persist across container restarts. Use `docker compose down` to stop the services while keeping their data. Adding `-v` also deletes the volumes and permanently removes the local database and S3 data.

### 2. Set up the backend

Create `backend/.env` from its example, then set `DATABASE_URL` to the local Postgres URL below, set `JWT_SECRET_KEY` to a generated secret, and add your OpenAI API key if you want to use AI-powered chat:

```env
LOCALSTACK_AUTH_TOKEN=your-token
```

Create `backend/.env` from its example, then set `DATABASE_URL` to the local Postgres URL below, set `JWT_SECRET_KEY` to a generated secret, and add your OpenAI API key if you want to use AI-powered chat:

```bash
cp backend/.env.example backend/.env
```

In `backend/.env`, configure:

```env
DATABASE_URL=postgresql+psycopg://supportsense:password@localhost:5432/supportsense
JWT_SECRET_KEY=your-generated-secret
```

The example file configures S3 for local development: `S3_BUCKET_NAME=supportsense-documents-local`, `S3_ENDPOINT_URL=http://localhost:4566`, and the dummy LocalStack credentials `test` / `test`. Keep these values for local development. When `S3_ENDPOINT_URL` is set, the backend sends S3 calls to LocalStack; when it is unset in Lambda, boto3 uses the Lambda execution role and AWS S3.

Generate a secret with `openssl rand -hex 32`. Do not use LocalStack credentials or the LocalStack endpoint in production.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

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

The public CloudForge landing page and support chat run at http://localhost:3000 (also available at `/chat`). Visitors can chat without an account. Sign in to manage support documents at `/admin/login` using the admin account you created above. Public chat requests are restricted to organization 1; change `PUBLIC_ORGANIZATION_ID` in the frontend service and `PUBLIC_ORGANIZATION_ID` in the backend environment together if the demo organization changes.

## Status

🚧 In active development.

## Tests

Run the backend unit and request-flow tests from `backend/`:

```bash
cd backend
.venv/bin/python -m unittest discover -s tests -v
```

Run the frontend service-journey tests and lint from `frontend/`:

```bash
cd frontend
npm test
npm run lint
```

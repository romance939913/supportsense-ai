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

The public CloudForge landing page and support chat run at http://localhost:3000 (also available at `/chat`). Visitors can chat without an account. Sign in to manage support documents at `/admin/login` using the admin account you created above. Public chat requests are restricted to organization 1; change `PUBLIC_ORGANIZATION_ID` in the frontend service and `PUBLIC_ORGANIZATION_ID` in the backend environment together if the demo organization changes.

## Status

🚧 In active development.

## Deployment readiness

The Next.js frontend is configured for static export to `frontend/out`, so it can
be hosted as a static site. Set `NEXT_PUBLIC_API_URL` in the frontend build
environment to the public FastAPI URL. Set `FRONTEND_ORIGIN` in the backend
environment to the exact deployed frontend origin so browser requests pass CORS.
The backend continues to use a private S3 bucket for uploaded support PDFs; keep
AWS credentials and the OpenAI API key only in the backend's secret environment.
Public chat is capped at 10 requests per browser visitor and 100 requests total
per UTC day by default. Configure `DAILY_CHAT_LIMIT_PER_VISITOR` and
`DAILY_CHAT_LIMIT_GLOBAL` in the backend environment to change those caps.

Use `.env.example` for backend configuration and `frontend/.env.example` for the
frontend API URL. Do not commit real credentials.

### Milestone 12 deployment

The lowest-cost managed setup for this portfolio demo is Cloudflare Pages for
the static frontend and Google Cloud Run for the FastAPI backend, with the
existing Neon free Postgres project and private AWS S3 bucket. Cloud Run has a
monthly free usage allowance and scales to zero; billing is still required,
and usage beyond the free allowance can be charged. The initial API request
after inactivity may take longer while Cloud Run starts the container.

See [infra/gcp/cloud-run-deploy.md](infra/gcp/cloud-run-deploy.md) for the
backend image, secret names, migration, and Pages settings. The Cloud Run
service is limited to one instance to keep costs predictable. Keep all runtime
secrets in Google Secret Manager.

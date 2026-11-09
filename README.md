# SupportSense AI

**Support answers grounded in your team's own documentation.** SupportSense turns support PDFs into a searchable knowledge base, then uses retrieval-augmented generation (RAG) to answer customer questions with citations to the source material.

Official website: https://supportsense-ai.pages.dev/

This repository includes a CloudForge demo tenant: CloudForge is the fictional company whose support guides power the sample chat experience. **SupportSense is the product; CloudForge is the example customer.**

## What it does

- **Answers from approved support content.** Retrieves relevant passages from organization-owned documents and uses them to generate grounded responses.
- **Shows its sources.** Answers include cited document passages, and users can open the source PDF preview.
- **Lets support admins manage knowledge.** Admins can upload and process PDFs, review their document library, and manage existing documents.
- **Keeps tenant data scoped.** Documents, chunks, and administrative access are associated with an organization.
- **Protects the upload path.** Uploads must be readable PDFs with 10 pages or fewer and a maximum file size of 10 MiB.
- **Includes public-chat quotas.** Visitor and global daily limits help bound anonymous demo usage.

## Product tour

### Customer support chat

Click the Get Support button on the home page to be directed to the customer chat page. SupportSense uses retrieval-augmented generation (RAG) to find relevant passages in CloudForge's support documentation and return an AI-generated answer with source citations.

![SupportSense chat answering a CloudForge support question](docs/media/chat-demo-gif-large.gif)

### Admin document portal

Support admins use this portal to submit new documentation. Uploads must be readable PDFs that meet the document limits: no more than 10 pages and no larger than 10 MiB. After upload, the API stores the original PDF in AWS S3, extracts and chunks its text, generates embeddings, and saves the document record and searchable vectors in PostgreSQL with pgvector.

![Admin portal uploading CloudForge support documentation](docs/media/admin-demo-gif-large.gif)

## How it works

```mermaid
flowchart LR
    Visitor[Customer] --> Web[Next.js web app]
    Admin[Support admin] --> Web
    Web --> API[FastAPI]
    API --> DB[(PostgreSQL + pgvector)]
    API --> S3[(S3 document storage)]
    API --> OpenAI[OpenAI embeddings and chat]
```

For ingestion, the API stores the uploaded PDF in S3-compatible storage, extracts its text, splits it into chunks, and stores embeddings in PostgreSQL with pgvector. For a chat question, it retrieves relevant chunks, asks the language model to answer from those passages, and returns the answer with source details.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| API | FastAPI, Python, SQLAlchemy, Alembic |
| Data | PostgreSQL, pgvector |
| File storage | Amazon S3; LocalStack for local development |
| AI | OpenAI embeddings and chat completions |
| Local services | Docker Compose |

## Run it locally

### Prerequisites

- Docker Desktop
- Python 3.11 or newer
- Node.js 20 or newer
- A LocalStack developer auth token for the current LocalStack image
- An OpenAI API key

### 1. Start PostgreSQL and LocalStack

From the repository root, create the Compose environment file and set `LOCALSTACK_AUTH_TOKEN` to your LocalStack developer token:

```bash
cp .env.example .env
```

Then start the local services:

```bash
docker compose up -d
```

Compose starts PostgreSQL on port `5432` and LocalStack on port `4566`. The startup script creates the `supportsense-documents-local` bucket. Local database and S3 data persist in Docker volumes. Run `docker compose down` to stop the services; add `-v` only when you want to delete their stored data.

### 2. Configure and start the API

In a new terminal, create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Set these values in `backend/.env` for local development:

```env
DATABASE_URL=postgresql+psycopg://supportsense:password@localhost:5432/supportsense
JWT_SECRET_KEY=<a-long-random-secret>
OPENAI_API_KEY=<your-openai-api-key>
```

Generate a secret with `openssl rand -hex 32`. Keep the local S3 settings from the example file: they point the API at LocalStack and use its local dummy credentials. Do not use those settings in production.

Install dependencies, apply migrations, create an admin account, and start FastAPI:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.scripts.create_admin
uvicorn app.main:app --reload
```

The API is available at <http://127.0.0.1:8000>; interactive API docs are at <http://127.0.0.1:8000/docs>.

### 3. Configure and start the web app

In another terminal:

```bash
cp frontend/.env.example frontend/.env.local
cd frontend
npm install
npm run dev
```

The CloudForge demo site and public support chat are available at <http://localhost:3000> and <http://localhost:3000/chat>. The admin login is at <http://localhost:3000/admin/login>; use the admin account created in the previous step.

The public chat is configured for organization `1`. If you change the demo organization, update `PUBLIC_ORGANIZATION_ID` in the backend environment and the frontend answer service together.

## Tests and checks

Run the backend tests from the repository root:

```bash
cd backend
.venv/bin/python -m unittest discover -s tests -v
```

Run the frontend service tests and lint:

```bash
cd frontend
npm test
npm run lint
```

## Current scope

SupportSense is a portfolio-ready prototype. The repository demonstrates document ingestion, organization-scoped retrieval, cited support answers, and an admin document workflow. The CloudForge site and documents are example tenant content.

## Project structure

```text
backend/     FastAPI application, RAG services, migrations, and tests
frontend/    Next.js customer and admin experiences
infra/aws/   Runtime S3 IAM policy and deployment notes
localstack/  Local S3 bucket initialization
```

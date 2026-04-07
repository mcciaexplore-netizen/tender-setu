# TenderSetu

TenderSetu is a full-stack tender discovery and tracking app with:

- a React + Vite frontend
- an Express + TypeScript REST API
- a Prisma + PostgreSQL database layer
- a Python scraper workspace for CPPP ingestion

## Project Structure

- `frontend` - React application
- `backend/api` - Express API
- `backend/database` - Prisma schema, migrations, and seed data
- `backend/scrapers/cppp` - scraper utilities
- `docker-compose.yml` - local PostgreSQL container config

## Tech Stack

- Frontend: React 18, React Router, Vite, TypeScript, Tailwind CSS
- Backend: Express, TypeScript, Prisma, Zod, JWT
- Database: PostgreSQL

## Local Ports

- Frontend: `5173`
- API: `3000`
- PostgreSQL: `5432`

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL running locally on port `5432`

Optional:

- Docker, if you want to run Postgres with `docker compose`

## Environment Setup

API example env is already included at `backend/api/.env.example`.

Typical API values:

```env
DATABASE_URL="postgresql://pratikkk@localhost:5432/tendersetu?schema=public"
JWT_SECRET="change-this-to-a-long-random-secret-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
SCRAPER_API_KEY="dev-scraper-key-change-in-production"
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

Database env lives in `backend/database/.env`.

## Install Dependencies

Install dependencies in each workspace:

```bash
cd frontend && npm install
cd ../backend/api && npm install
cd ../database && npm install
```

## Start PostgreSQL

Option 1: local PostgreSQL service

Make sure PostgreSQL is running and that the `tendersetu` database exists.

Option 2: Docker Compose

```bash
docker compose up -d postgres
```

## Run Database Migrations

```bash
cd backend/database
npm run db:migrate:deploy
```

## Seed Sample Data

```bash
cd backend/database
npm run db:seed
```

The seed currently creates:

- 20 tenders
- 4 scraper logs
- 1 sample user
- 1 alert

## Run the App

Start the API:

```bash
cd backend/api
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Open:

- Frontend: `http://127.0.0.1:5173/`
- API health: `http://127.0.0.1:3000/health`

## Useful Commands

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run preview
```

API:

```bash
cd backend/api
npm run dev
npm run build
npm run start
```

Database:

```bash
cd backend/database
npm run db:migrate:deploy
npm run db:push
npm run db:seed
npm run db:studio
```

## API Notes

- Base URL: `http://localhost:3000/api`
- Health endpoint: `GET /health`
- Tender endpoints:
  - `GET /api/tenders`
  - `GET /api/tenders/stats`
  - `GET /api/tenders/:id`

## Frontend Behavior

The frontend is wired to the API at `http://localhost:3000/api`.

For a smoother local demo, the frontend also falls back to local mock data for several flows if the API is unavailable. That means the UI can still render even when the backend is down, but full persistence requires the API and PostgreSQL to be running.

## GitHub

This project is now pushed to:

`https://github.com/mcciaexplore-netizen/tender-setu`

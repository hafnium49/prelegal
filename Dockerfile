# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build the Next.js frontend into a static bundle ----------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: backend + static frontend ----------
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.8.22 /uv /uvx /bin/

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first (cacheable layer)
COPY backend/pyproject.toml backend/uv.lock* ./
RUN uv sync --no-dev --no-install-project

# Copy backend source and install the project itself
COPY backend/ ./
RUN uv sync --no-dev

# Drop built frontend into the static dir served by FastAPI
COPY --from=frontend-builder /app/frontend/out ./src/prelegal/static

# Ephemeral SQLite DB lives here; not volume-mounted, so it resets on each boot
RUN mkdir -p /data

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "prelegal.main:app", "--host", "0.0.0.0", "--port", "8000"]

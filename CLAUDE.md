# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The UI should have an AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered in the `catalog.json` file in the project root, included here:

`@catalog.json`

V1 status: all 12 Common Paper templates listed in `catalog.json` are supported via a freeform AI chat (Cerebras `gpt-oss-120b` via OpenRouter/LiteLLM with Structured Outputs). Users register, sign in, and each user's drafts are auto-saved to a personal sidebar (database is reset each container boot). The AI gathers cover-page fields, populates a live preview with a draft disclaimer, and lets the user save with the browser's Print → Save as PDF.

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

`OPENROUTER_API_KEY` lives in `.env` at the project root and is loaded by `load_dotenv()` in `create_app()`. When running in Docker, pass it through with `docker run --env-file .env ...` (the `.env` itself is gitignored and not baked into the image).

## Technical design

The entire project should be packaged into a Docker container. The backend should be in `backend/` and be a uv project, using FastAPI. The frontend should be in `frontend/` 
The database should use SQLLite and be created from scratch each time hte Docker container is brought up, allowing for a users table with sign up and sign in.
Consider statically building the frontend and serving it via FastAPI, if that will work. There should be scripts in `scripts/` for:

```bash
# Mac
scripts/start-mac.sh   # Start
scripts/stop-mac.sh    # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Backend available at http://localhost:8000

## Color Scheme

- Accent Yellow: #ecad0a
- Blue Primary: #209dd7
- Purple Secondary: #753991 (submit buttons)
- Dark Navy: #032147 (headings)
- Gray Text: #888888

## Implementation status

### Done
- **KAN-3** — Next.js 16 + Tailwind v4 client-side MNDA generator: form on the left, live preview on the right, "Download / Print PDF" via the browser's print dialog (`frontend/src/{app,components,lib}`).
- **KAN-4** — V1 technical foundation:
  - FastAPI + uv backend at `backend/` (`src/prelegal/`), serves `GET /api/health` and an explicit `/api/{path:path}` JSON 404 catch-all so unknown API paths never fall through to the static mount.
  - Ephemeral SQLite at `/data/prelegal.db` inside the container; `prelegal.db.init_db()` drops & recreates the `users` table on every container boot (no volume mount, by design).
  - Next.js builds via `output: "export"` and is served as static files by FastAPI at `/` — single container, single port (8000).
  - Fake login at `/login` (any name + email; stored in `localStorage["prelegal.user"]`); `<LoginGate>` redirects unauthenticated visitors; Sign out clears storage and returns to `/login`. No real auth wired up.
  - Multi-stage `Dockerfile` (node:20-alpine builds frontend → python:3.12-slim + pinned `uv 0.8.22` runs backend).
  - Cross-platform scripts in `scripts/`: `start/stop-{mac,linux}.sh`, `start/stop-windows.ps1`.
  - Pytest smoke suite in `backend/tests/test_smoke.py` (health, users schema, fresh-DB-per-boot, JSON 404, static index/login when built).
- **KAN-5** — AI chat for the MNDA:
  - `POST /api/chat` endpoint backed by LiteLLM → OpenRouter → Cerebras (`openrouter/openai/gpt-oss-120b`, `reasoning_effort="low"`); request: `{messages, form}`; response: `{reply, form_updates}`. Structured output via `response_format={"type":"json_schema",...}` with the `ChatResponse` Pydantic schema; Pydantic validates the parsed JSON on our side.
  - System prompt in `backend/src/prelegal/llm.py` enumerates MNDA fields, injects today's date + current form state, instructs plain-text replies (no markdown), and points the user to "Download / Print PDF" when complete (there is no finalize step).
  - `frontend/src/components/ChatPane.tsx` — chat UI with messages list, "Thinking…" indicator, error banner; replaces the previous form. `frontend/src/lib/chat.ts` defines the wire types and the `mergeFormUpdates` reducer that folds AI updates into form state.
  - CORS in `backend/src/prelegal/main.py` allows `http://localhost:3000` for the dev workflow (`npm run dev` against a Docker backend); production is same-origin so CORS isn't exercised.
  - `pyproject.toml` adds `litellm`, `pydantic`, `python-dotenv`. `OPENROUTER_API_KEY` is loaded by `load_dotenv()` in `create_app()`.
  - 6 new pytest cases in `backend/tests/test_chat.py` cover happy path, party updates, LLM exceptions, malformed JSON, empty-choices, and the system-message contents (all using a mocked `litellm.completion`).
- **KAN-6** — all 12 catalog document types + generic renderer:
  - `backend/src/prelegal/documents.py` — declarative `DocumentSpec` (id, fields, party_roles) for all 12 catalog entries. Name/description/source_url loaded from `catalog.json` at startup (single source of truth).
  - `backend/src/prelegal/templates.py` — bundled-template reader (`/app/templates` in Docker, falls back to repo root for `uv run`).
  - `GET /api/documents` — catalog with full field specs. `GET /api/documents/{id}/template` — the raw markdown for any doc.
  - Chat: schema now generic — `FormState = {document_type, field_values: dict, parties: list}`. `reasoning_effort` bumped to `"medium"` (the skill example's `"low"` silently dropped party fields). Dynamic system prompt lists the catalog + per-doc field/party spec + few-shot extraction examples + an "always ask follow-on" + a "verify before declaring complete" rule. AI handles "I want an unsupported doc" by suggesting the closest catalog match.
  - `frontend/src/components/DocumentPreview.tsx` — generic renderer (cover-page summary + signature block + `react-markdown` body) replacing `<MndaPreview>`. The old `MndaForm.tsx`, `MndaPreview.tsx`, `PlaceholderText.tsx`, `mnda.ts`, `mnda-standard-terms.ts` are deleted.
  - `ChatPane` now auto-focuses the input and refocuses after every reply (success or error).
  - `Dockerfile` adds `COPY templates /app/templates` and `COPY catalog.json /app/catalog.json`.
  - `react-markdown`, `rehype-raw`, `remark-gfm` added to the frontend.
  - 8 chat tests + 3 documents tests in `backend/tests/` (rewritten for the new schema).
- **KAN-7** — multiple users + per-user drafts + polish:
  - Real auth: `users` table now has `password_hash` (bcrypt); `sessions` table holds opaque random session tokens; `documents` table holds per-user drafts. `POST /api/auth/{register,login,logout}` + `GET /api/auth/me` with an httponly cookie. `secure` flag is env-driven (`PRELEGAL_COOKIE_SECURE`, default false for HTTP dev).
  - Endpoint shape: `/api/documents` (catalog) was renamed to `/api/catalog`; `/api/my-documents/**` is per-user CRUD. `/api/chat` and `/api/my-documents/**` are gated with `require_user`; `/api/catalog`, `/api/health`, and the auth endpoints are public.
  - Auto-save: every form mutation triggers a debounced (500ms) save to `/api/my-documents`. A ref guards against duplicate-doc creation across React re-render boundaries.
  - Sidebar: `<DocumentsSidebar>` lists drafts (auto-titled `"<Doc name> — <party 1 company>"`), supports +New / select / delete.
  - Auth + disclaimer: `<AuthGate>` redirects to `/login` if no session. Persistent yellow disclaimer banner (`#ecad0a`) above the workspace + footer on the printed document.
  - Polish: branded login/register pages (gradient + wordmark + palette-driven inputs), `<Wordmark>` component, sticky header.
  - Tests: `test_auth.py` (8), `test_my_documents.py` (6 — including cross-user isolation), updated `test_chat.py` for auth gating.
  - Frontend deps unchanged. Backend adds `bcrypt`.

### Not yet implemented (future tickets)
- CI workflow.

### Quick commands
```bash
# Run the full stack in Docker (linux/mac); reads OPENROUTER_API_KEY from .env
scripts/start-linux.sh        # → http://localhost:8000
scripts/stop-linux.sh

# Backend tests
cd backend && uv run pytest

# Frontend dev iteration against a Docker backend (chat needs the API)
# Terminal 1: backend
scripts/start-linux.sh
# Terminal 2: frontend pointing at the Docker backend
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
# → http://localhost:3000 (CORS in backend allows this origin)
```
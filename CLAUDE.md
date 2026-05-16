# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The UI should have an AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered in the `catalog.json` file in the project root, included here:

`@catalog.json`

V1 scope: only the Mutual NDA document is supported; broader template support is planned for later tickets. The backend, Docker packaging, fake login, and the AI chat for the MNDA already exist (see "Implementation status" below).

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

Add an `OPENROUTER_API_KEY` to the `.env` file at the project root before wiring up the AI calls (the file currently only holds the GitHub PAT).

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

### Not yet implemented (future tickets)
- Real authentication (sign-up, sign-in, password hashing, sessions) — the `users` table schema exists but no endpoints touch it.
- Catalog / template API surface; today the frontend has the MNDA template hard-coded in `frontend/src/lib/mnda-standard-terms.ts`.
- Document support beyond Mutual NDA (BAA, CSA, DPA, PSA, SLA, etc. — all listed in `catalog.json` but not yet generated).
- CI workflow.

### Quick commands
```bash
# Run the full stack in Docker (linux/mac)
scripts/start-linux.sh        # → http://localhost:8000
scripts/stop-linux.sh

# Backend tests
cd backend && uv run pytest

# Frontend dev iteration (no Docker, no backend)
cd frontend && npm run dev    # → http://localhost:3000
```
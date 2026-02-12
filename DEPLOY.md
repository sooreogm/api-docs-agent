# Deploy API Docs Agent as a Service

This guide covers deploying the app so users can open a URL, paste their OpenAPI/Swagger URL, and get shareable docs links.

---

## Quick deploy with Docker

```bash
# Build and run locally (frontend is built inside the image)
docker build -t api-docs-agent .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-... api-docs-agent
```

Open **http://localhost:8000/agent-docs/** for the docs UI. The API is at `http://localhost:8000/api/...`.

To use a different port (e.g. for Render/Railway):

```bash
docker run -p 3000:3000 -e PORT=3000 -e OPENAI_API_KEY=sk-... api-docs-agent
```

---

## Environment variables

Configure via env vars (no `.env` required in production).

| Variable                  | Required | Description                                                                                                                              |
| ------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`          | No\*     | OpenAI API key for AI overview and code examples. If unset, templates are used and overview summary is skipped.                          |
| `OPENAI_MODEL`            | No       | Model name (default: `gpt-4o-mini`).                                                                                                     |
| `PORT`                    | No       | Port the server listens on (default: `8000`). Set by many platforms (Render, Railway, Fly, etc.).                                        |
| `DEFAULT_OPENAPI_URL`     | No       | When set, requests with no `openapi_url` use this spec (e.g. "Load my API docs" uses this URL).                                          |
| `ALLOWED_OPENAPI_ORIGINS` | No       | Comma-separated origins (e.g. `https://api.example.com,https://api.other.com`). When set, only those APIs can be loaded; others get 403. |

\* Required only if you want AI-generated overview and richer code examples.

---

## Build and run without Docker

From the repo root:

```bash
# Install backend deps (uv or pip)
uv sync
# or: pip install -r requirements.txt

# Build frontend (required for /agent-docs/ UI)
cd frontend && npm ci && npm run build && cd ..

# Run (production: bind to 0.0.0.0 and optional PORT)
PORT=8000 uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or use the script (builds frontend if missing):

```bash
chmod +x scripts/run_production.sh
PORT=8000 ./scripts/run_production.sh
```

Or with Make:

```bash
make build-frontend   # one-time
make serve            # PORT=8000 by default; override with make serve PORT=3000
```

---

## Routes

| Path                              | Description                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/agent-docs/`                    | Docs UI (Next.js app). Paste OpenAPI URL, view docs, chat, generate examples. Share links: `?openapi_url=...` |
| `/api/agent-docs`                 | Structured docs JSON (for the UI or API consumers).                                                           |
| `/api/agent/chat`                 | Chat with the docs agent.                                                                                     |
| `/api-reference/generate-example` | Generate code example for an endpoint.                                                                        |
| `/docs`                           | Server-rendered API reference for this app’s own OpenAPI.                                                     |
| `/health`                         | Health check (returns `{"status":"ok"}`). Use for platform health checks.                                     |

---

## Deploying to a platform

- **Render / Railway / Fly.io**: Connect the repo, use the **Dockerfile** (or set build to Docker). Set `OPENAI_API_KEY` (and optionally `DEFAULT_OPENAPI_URL`, `ALLOWED_OPENAPI_ORIGINS`) in the dashboard. They usually set `PORT` automatically.
- **Google Cloud Run / AWS ECS**: Build the image from the Dockerfile, push to your registry, run with `PORT=8080` (or the platform’s default) and the env vars above.
- **Single server**: `docker run` or `make serve` behind nginx/caddy with TLS.

After deploy, share the **/agent-docs/** URL; users can paste any public OpenAPI/Swagger URL and share the resulting link (e.g. `https://your-app.com/agent-docs/?openapi_url=https://api.example.com/openapi.json`).

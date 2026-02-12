# API Docs Agent

Standalone library that builds **API reference HTML** from an OpenAPI schema and **generates frontend/mobile code examples** (templates or OpenAI). No dependency on any specific backend; use with FastAPI, Flask, or any app that can serve HTML and expose an OpenAPI spec.

---

## Use with any OpenAPI / Swagger doc

You can use this app as a **single deployment** to document any API:

- **OpenAPI 3.x** and **Swagger 2 (OpenAPI 2.0)** are supported. Schema references resolve from both `#/components/schemas/` (OAS3) and `#/definitions/` (Swagger 2).
- Pass a **base URL** (e.g. `https://api.example.com`) or a **direct spec URL** (e.g. `https://api.example.com/openapi.json` or `.../swagger.json`). When you pass a base URL, the app tries `/openapi.json`, `/swagger.json`, and `/api-docs` in order.
- Optional env vars for a shared docs portal:
  - **`DEFAULT_OPENAPI_URL`** — When set, requests without an `openapi_url` (e.g. "Load my API docs" or no query param) use this spec instead of the app's own OpenAPI.
  - **`ALLOWED_OPENAPI_ORIGINS`** — Comma-separated list of origins (e.g. `https://api.example.com,https://api.other.com`). When set, only those APIs can be loaded; other URLs return 403.

**Deploy as a service:** See **[DEPLOY.md](DEPLOY.md)** for Docker, env vars, build/run commands, and platform notes. The app serves the docs UI at `/agent-docs/` and the API at `/api/...`; use `PORT` and `OPENAI_API_KEY` in production.

---

## What's inside

- **`build_api_reference_html(openapi_schema, base_url)`** — Renders a full docs page: sidebar, overview, per-endpoint "how to call", parameters/request/response schemas, and "Implement in your stack" tabs (web + mobile).
- **`generate_example(method, path, stack, operation, base_url, openai_api_key)`** — Returns code for one endpoint in a given stack (template if no API key, else OpenAI).
- **`get_operation(openapi_schema, path, method)`** — Fetches the OpenAPI operation object for a path/method.
- **`STACKS`** — List of `(value, label)` for supported stacks (React, Vue, Next.js, Angular, Svelte, Vanilla JS, React Native, Flutter, Swift iOS, Kotlin Android).

---

## Step-by-step: Move into a new project / copy into another folder

### 1. Copy the whole folder

Copy the entire **`api-docs-agent`** directory to where you want the standalone project to live. For example:

```bash
# From the repo that contains api-docs-agent (e.g. klarnow-internal-backend):
cp -r api-docs-agent /path/to/your/projects/

# Or clone/copy only this folder to a new repo
```

You can also move it (e.g. into a separate git repo) instead of copying.

### 2. (Optional) Copy into another existing project

To use the docs agent inside an existing app (e.g. another FastAPI project):

1. Copy the **`api-docs-agent`** folder into that project's root (or a `lib/` / `packages/` directory).
2. Install it in editable mode from that path:

   ```bash
   cd /path/to/your/existing/project
   pip install -e ./api-docs-agent
   ```

   Or add the path to `PYTHONPATH`:

   ```bash
   export PYTHONPATH="/path/to/your/existing/project/api-docs-agent:$PYTHONPATH"
   ```

3. In your app code, import from the package:

   ```python
   from api_docs_agent import build_api_reference_html, generate_example, get_operation, STACKS
   ```

### 3. Install dependencies (in the copied folder)

```bash
cd api-docs-agent
pip install -e .
# Optional: for AI-generated examples
pip install openai
```

### 4. Use in a FastAPI app (example)

In your main app (e.g. `main.py`):

```python
import os
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field

# Use the standalone package (after pip install -e /path/to/api-docs-agent)
from api_docs_agent import (
    build_api_reference_html,
    generate_example,
    get_operation,
    STACKS,
)

app = FastAPI(title="My API", version="1.0.0")

def custom_openapi():
    if app.openapi_schema is None:
        app.openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            openapi_version=app.openapi_version,
            routes=app.routes,
        )
    return app.openapi_schema

@app.get("/api-reference", response_class=HTMLResponse)
def api_reference_page(request: Request):
    schema = custom_openapi()
    base_url = str(request.base_url).rstrip("/")
    return build_api_reference_html(schema, base_url=base_url)

class GenerateExampleRequest(BaseModel):
    path: str = Field(..., description="API path")
    method: str = Field(..., description="GET, POST, etc.")
    stack: str = Field(..., description="e.g. react-fetch, vue3, flutter")
    base_url: str | None = None

@app.post("/api-reference/generate-example")
def api_reference_generate_example(request: Request, body: GenerateExampleRequest):
    schema = custom_openapi()
    base_url = (body.base_url or str(request.base_url)).rstrip("/")
    method = (body.method or "get").upper()
    allowed = {s[0] for s in STACKS}
    if body.stack not in allowed:
        raise HTTPException(400, detail=f"stack must be one of: {', '.join(sorted(allowed))}")
    op = get_operation(schema, body.path, method)
    code = generate_example(
        method=method,
        path=body.path,
        stack=body.stack,
        operation=op,
        base_url=base_url,
        openai_api_key=os.getenv("OPENAI_API_KEY"),
    )
    return {"code": code}
```

The generated HTML page will call `POST /api-reference/generate-example` when the user clicks "Generate example"; ensure that URL matches the route you define.

### 5. (Optional) Remove from the original repo

After you've copied and verified the standalone project:

- You can delete the **`api-docs-agent`** folder from the original repo, and in that repo switch to using the package from the new location (e.g. `pip install -e /path/to/api-docs-agent` and the same imports as above).

---

## Summary

| Step | Action                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| 1    | Copy the **`api-docs-agent`** folder to a new location or into another project.                                          |
| 2    | In the target project: `pip install -e ./api-docs-agent` (or add to `PYTHONPATH`).                                       |
| 3    | Import `build_api_reference_html`, `generate_example`, `get_operation`, `STACKS` from `api_docs_agent`.                  |
| 4    | Serve the HTML at e.g. `GET /api-reference` and the generate-example endpoint at `POST /api-reference/generate-example`. |
| 5    | Optionally remove `api-docs-agent` from the original repo and rely on the copied package.                                |

No dependencies are required for template-only examples; install **`openai`** for AI-generated code snippets.

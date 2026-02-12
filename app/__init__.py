
# API Docs Agent — OpenAPI-based API reference HTML and code example generation.
#  Use with any OpenAPI 3 schema (e.g. from FastAPI's get_openapi()).

from .api_reference import build_api_reference_html
from .docs_agent import STACKS, generate_example, get_operation

__all__ = [
    "build_api_reference_html",
    "generate_example",
    "get_operation",
    "STACKS",
]

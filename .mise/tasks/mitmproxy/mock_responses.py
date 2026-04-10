"""
Mitmproxy addon that replays stored responses for matched URLs.

The responses file must be passed at boot via --set:

    mitmdump -s mock_responses.py --set mock_responses_file=/path/to/responses.json

Example files are located in apps/ledger-live-desktop/tests/mocks/.

URL matching
------------
Keys in the JSON file are matched against the intercepted request URL without
query parameters. This allows API keys or other tokens that appear in the query
string to be omitted from the JSON file, avoiding accidental secret exposure.

For example, the key:

    https://firebaseremoteconfig.googleapis.com/v1/projects/my-project/namespaces/firebase:fetch

will match any request to that path regardless of query string (e.g. ?key=...).
"""

import json
import os
from urllib.parse import urlparse

from mitmproxy import ctx, http
from mitmproxy.http import Headers

MOCK_RESPONSES: dict = {}


def load(loader):
    loader.add_option(
        name="mock_responses_file",
        typespec=str,
        default="",
        help="Path to JSON file mapping URLs to mock responses",
    )


def configure(updated):
    if "mock_responses_file" in updated:
        _load(ctx.options.mock_responses_file)


def _load(path: str) -> None:
    global MOCK_RESPONSES
    if not os.path.isfile(path):
        ctx.log.warn(f"[mock_responses] File not found: {path}")
        return
    with open(path) as f:
        MOCK_RESPONSES = json.load(f)
    ctx.log.info(f"[mock_responses] Loaded {len(MOCK_RESPONSES)} mock entries from {path}")


def _url_without_query(url: str) -> str:
    parsed = urlparse(url)
    return parsed._replace(query="", fragment="").geturl()


def request(flow: http.HTTPFlow) -> None:
    url = _url_without_query(flow.request.pretty_url)
    if url in MOCK_RESPONSES:
        entry = MOCK_RESPONSES[url]
        body = json.dumps(entry["response"]).encode("utf-8")
        raw_headers = entry.get("headers", {})
        flow.response = http.Response.make(200, body)
        flow.response.headers = Headers([(k.encode(), v.encode()) for k, v in raw_headers.items()])
        ctx.log.info(f"[mock_responses] Mocked: {url}")

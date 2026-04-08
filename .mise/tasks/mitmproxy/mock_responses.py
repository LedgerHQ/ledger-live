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

Keys support a single ``*`` wildcard that matches any characters in the path.
This is useful when the URL contains a project ID or other token that differs
between platforms (e.g. desktop vs. mobile).

Exact keys (no ``*``) are always checked first and take precedence over wildcard
keys, preserving full backwards compatibility.

Examples:

    # exact match — works as before, query string still ignored
    https://firebaseremoteconfig.googleapis.com/v1/projects/my-project/namespaces/firebase:fetch

    # wildcard match — covers any project ID on the same endpoint
    https://firebaseremoteconfig.googleapis.com/v1/projects/*/namespaces/firebase:fetch
"""

import fnmatch
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
    if not path:
        return  # no mock file configured — run as transparent proxy
    if not os.path.isfile(path):
        raise ValueError(f"[mock_responses] Mock file not found: {path}")
    with open(path) as f:
        try:
            MOCK_RESPONSES = json.load(f)
        except json.JSONDecodeError as exc:
            raise ValueError(f"[mock_responses] Mock file is not valid JSON: {path}: {exc}") from exc
    ctx.log.info(f"[mock_responses] Loaded {len(MOCK_RESPONSES)} mock entries from {path}")


def _url_without_query(url: str) -> str:
    parsed = urlparse(url)
    return parsed._replace(query="", fragment="").geturl()


def _find_entry(url: str):
    """Return (key, entry) for the first matching mock, or (None, None).

    Exact keys take precedence over wildcard keys, preserving the original
    behaviour for all existing mock files that use exact URL keys.
    """
    # 1. Exact match — identical to the original lookup
    if url in MOCK_RESPONSES:
        return url, MOCK_RESPONSES[url]
    # 2. Wildcard match — only reached when no exact key matched
    for key, entry in MOCK_RESPONSES.items():
        if "*" in key and fnmatch.fnmatch(url, key):
            return key, entry
    return None, None


_LOOPBACK_HOSTS = frozenset(("127.0.0.1", "localhost", "::1"))


def http_connect(flow: http.HTTPFlow) -> None:
    """Drop CONNECT tunnel requests to loopback addresses immediately.

    When the Android emulator uses -http-proxy, ALL HTTP(S) traffic is routed
    through mitmproxy — including connections the app makes to 127.0.0.1 (the
    emulator's own loopback, e.g. ADB-reverse-forwarded ports). mitmproxy then
    tries to connect to 127.0.0.1:PORT on the *runner host*, which has no such
    service, producing [Errno 111] Connection refused errors and slow timeouts.

    Killing these flows here prevents the upstream connection attempt entirely.
    From the app's perspective the result is the same (connection refused), but
    it fails fast rather than waiting for a TCP timeout.
    """
    host = flow.server_conn.address[0]
    if host in _LOOPBACK_HOSTS:
        flow.kill()


def request(flow: http.HTTPFlow) -> None:
    url = _url_without_query(flow.request.pretty_url)
    key, entry = _find_entry(url)
    if entry is not None:
        body = json.dumps(entry["response"]).encode("utf-8")
        raw_headers = entry.get("headers", {})
        flow.response = http.Response.make(200, body)
        flow.response.headers = Headers([(k.encode(), v.encode()) for k, v in raw_headers.items()])
        ctx.log.info(f"[mock_responses] Mocked: {url} (matched key: {key})")

"""
Mitmproxy addon that lets one Firebase Remote Config fetch serve every app launch of a test run.

Every desktop E2E test launches a fresh app, and every launch fetches Remote Config before it
renders. Remote Config allows 60 fetches a minute per caller IP, so two overlapping full runs get
throttled (HTTP 429) and their tests start on compiled-default flags.

The first fetch for a key goes upstream. Fetches that arrive while it is in flight wait for it, and
every later fetch gets the stored answer. Only a 200 with `state: UPDATE` and entries is stored, so
a 429 or an empty template is passed through and the next fetch tries again.

    mitmdump -s firebase_capture.py --set firebase_capture_summary=/path/to/summary.json

Key: request path (one per Firebase project) + app_id + language_code + custom_signals.
Request and response bodies are never logged: they carry installation tokens and the flag template.
"""

import asyncio
import gzip
import hashlib
import json
import logging
import re
import time
import zlib
from dataclasses import dataclass

from mitmproxy import ctx, http

logger = logging.getLogger(__name__)

FETCH_PATH = re.compile(r"^/v1/projects/[^/]+/namespaces/firebase:fetch$")
STORED_HEADERS = ("content-type", "etag", "vary")
LEADER_KEY = "firebase_capture_key"
LEADER_FUTURE = "firebase_capture_future"


@dataclass
class Snapshot:
    body: bytes
    headers: dict[str, str]
    template_version: str
    entries: int
    captured_at: float


@dataclass
class KeyStats:
    upstream: int = 0
    replayed: int = 0
    timed_out: int = 0
    failed: int = 0


def request_json(request: http.Request) -> object:
    # The Firebase SDK sends `Content-Encoding: gzip` with a plain JSON body, so mitmproxy's decoding fails.
    raw = request.raw_content or b"{}"
    try:
        return json.loads(raw)
    except ValueError:
        pass
    try:
        return json.loads(gzip.decompress(raw))
    except (OSError, EOFError, ValueError, zlib.error):
        return None


def capture_key(flow: http.HTTPFlow) -> str | None:
    path = flow.request.path.split("?", 1)[0]
    if flow.request.method != "POST" or not FETCH_PATH.match(path):
        return None
    body = request_json(flow.request)
    if not isinstance(body, dict):
        return None
    # Keys are logged, so custom signals (request-body values) only appear as a hash.
    signals = body.get("custom_signals")
    signals_id = hashlib.sha256(json.dumps(signals, sort_keys=True).encode()).hexdigest()[:12] if signals else "none"
    return f"{path} app_id={body.get('app_id', '')} language_code={body.get('language_code', '')} custom_signals={signals_id}"


def usable_snapshot(response: http.Response | None) -> Snapshot | None:
    if response is None or response.status_code != 200:
        return None
    try:
        body = json.loads(response.get_text() or "")
    except ValueError:
        return None
    if not isinstance(body, dict) or body.get("state") != "UPDATE" or not body.get("entries"):
        return None
    headers = {
        name: value
        for name, value in response.headers.items()
        if name.lower() in STORED_HEADERS or name.lower().startswith("access-control-")
    }
    return Snapshot(
        body=response.content or b"",
        headers=headers,
        template_version=str(body.get("templateVersion", "")),
        entries=len(body["entries"]),
        captured_at=time.time(),
    )


class FirebaseCapture:
    def __init__(self) -> None:
        self.cache: dict[str, Snapshot] = {}
        self.inflight: dict[str, asyncio.Future] = {}
        self.stats: dict[str, KeyStats] = {}

    def load(self, loader) -> None:
        loader.add_option(
            name="firebase_capture_summary",
            typespec=str,
            default="",
            help="Path of the JSON summary written on shutdown (counts and template version per key)",
        )
        loader.add_option(
            name="firebase_capture_wait",
            typespec=int,
            default=20,
            help="Seconds a fetch waits for the in-flight fetch of its key before going upstream itself",
        )

    async def request(self, flow: http.HTTPFlow) -> None:
        key = capture_key(flow)
        if key is None:
            return
        stats = self.stats.setdefault(key, KeyStats())
        loop = asyncio.get_running_loop()
        deadline = loop.time() + ctx.options.firebase_capture_wait
        while key not in self.cache:
            leader = self.inflight.get(key)
            if leader is None:
                future = loop.create_future()
                self.inflight[key] = future
                flow.metadata[LEADER_KEY] = key
                flow.metadata[LEADER_FUTURE] = future
                flow.request.headers.pop("If-None-Match", None)
                stats.upstream += 1
                return
            try:
                # One budget per fetch, however many leaders fail in turn.
                await asyncio.wait_for(asyncio.shield(leader), max(0.0, deadline - loop.time()))
            except TimeoutError:
                flow.metadata[LEADER_KEY] = key
                flow.request.headers.pop("If-None-Match", None)
                stats.upstream += 1
                stats.timed_out += 1
                logger.warning(f"[firebase_capture] waited too long, going upstream: {key}")
                return
        stats.replayed += 1
        self._replay(flow, self.cache[key])

    def response(self, flow: http.HTTPFlow) -> None:
        key = flow.metadata.get(LEADER_KEY)
        if key is None:
            return
        if key not in self.cache:
            snapshot = usable_snapshot(flow.response)
            if snapshot is not None:
                self.cache[key] = snapshot
                logger.info(
                    f"[firebase_capture] captured {key} templateVersion={snapshot.template_version} entries={snapshot.entries}"
                )
                self._wake_waiters(key)
            elif LEADER_FUTURE in flow.metadata:
                self.stats[key].failed += 1
                logger.warning(f"[firebase_capture] leader failed {key} status={flow.response.status_code}")
        self._release(flow)

    def error(self, flow: http.HTTPFlow) -> None:
        key = flow.metadata.get(LEADER_KEY)
        if key is not None and LEADER_FUTURE in flow.metadata:
            self.stats[key].failed += 1
            logger.warning(f"[firebase_capture] leader failed {key} error={flow.error}")
        self._release(flow)

    def done(self) -> None:
        summary = {}
        for key, stats in self.stats.items():
            snapshot = self.cache.get(key)
            summary[key] = {
                "upstream": stats.upstream,
                "replayed": stats.replayed,
                "timedOut": stats.timed_out,
                "failed": stats.failed,
                "templateVersion": snapshot.template_version if snapshot else None,
                "entries": snapshot.entries if snapshot else None,
                "capturedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(snapshot.captured_at)) if snapshot else None,
                "bodySha256": hashlib.sha256(snapshot.body).hexdigest() if snapshot else None,
            }
            logger.info(
                f"[firebase_capture] summary {key} upstream={stats.upstream} replayed={stats.replayed} "
                f"timedOut={stats.timed_out} failed={stats.failed}"
            )
        if ctx.options.firebase_capture_summary:
            with open(ctx.options.firebase_capture_summary, "w") as f:
                json.dump(summary, f, indent=2)

    def _replay(self, flow: http.HTTPFlow, snapshot: Snapshot) -> None:
        headers = dict(snapshot.headers)
        origin = flow.request.headers.get("Origin")
        if origin:
            for name in [name for name in headers if name.lower() == "access-control-allow-origin"]:
                del headers[name]
            headers["access-control-allow-origin"] = origin
        flow.response = http.Response.make(200, snapshot.body, headers)

    def _wake_waiters(self, key: str) -> None:
        # A fetch that stopped waiting can fill the cache before the leader answers.
        future = self.inflight.pop(key, None)
        if future is not None and not future.done():
            future.set_result(None)

    def _release(self, flow: http.HTTPFlow) -> None:
        key = flow.metadata.get(LEADER_KEY)
        future = flow.metadata.pop(LEADER_FUTURE, None)
        if future is None:
            return
        if self.inflight.get(key) is future:
            del self.inflight[key]
        if not future.done():
            future.set_result(None)


addons = [FirebaseCapture()]

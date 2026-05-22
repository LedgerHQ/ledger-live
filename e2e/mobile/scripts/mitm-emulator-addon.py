"""
mitmproxy addon for the Ledger Live Mobile Detox workflow.

Two responsibilities:

1. Rewrite the emulator host alias (10.0.2.2 → 127.0.0.1) on the upstream
   connection so mitmproxy (running on the host) can actually reach Detox
   bridge endpoints. Without it the bridge times out with
   "Connect call failed ('10.0.2.2', <port>)" and Detox can't talk to
   the in-app client.

2. Optional per-test HAR capture. When MITM_HAR_DIR is set, the addon
   listens on MITM_CONTROL_PORT (default 8090) for newline-delimited
   JSON messages and writes one HAR per test:

      {"action": "start", "name": "<test full name>"}  -> clears buffer
      {"action": "end",   "name": "<test full name>"}  -> save HAR + clear

   The Jest setup hooks (e2e/mobile/setup.ts) fire these around every
   spec. The global `hardump` option still produces a fallback HAR with
   any flows that happened outside of test boundaries.

Run via e2e/mobile/scripts/mitm.sh; usage from CLI:

    mitmdump -s e2e/mobile/scripts/mitm-emulator-addon.py
"""

import asyncio
import json
import os
import re
from pathlib import Path
from typing import Optional

from mitmproxy import ctx


EMULATOR_HOST_ALIAS = "10.0.2.2"
LOOPBACK = "127.0.0.1"


def _safe_filename(name: str) -> str:
    # Filenames must be portable across Linux + macOS + zip archives —
    # collapse anything not alnum / dot / dash / underscore.
    sanitized = re.sub(r"[^\w.-]+", "_", name).strip("._-")
    return sanitized or "unknown"


class LedgerLiveAddon:
    def __init__(self) -> None:
        self.buffer: list = []
        self.current_test: Optional[str] = None
        self.har_dir: Optional[Path] = None
        self.shard = os.environ.get("MITM_SHARD", "")
        self.control_port = int(os.environ.get("MITM_CONTROL_PORT", "8090"))
        self._server: Optional[asyncio.base_events.Server] = None
        har_dir = os.environ.get("MITM_HAR_DIR")
        if har_dir:
            self.har_dir = Path(har_dir)

    async def running(self) -> None:
        if self.har_dir is None:
            ctx.log.info("[har-per-test] disabled (MITM_HAR_DIR unset)")
            return
        try:
            self._server = await asyncio.start_server(
                self._handle_client, LOOPBACK, self.control_port
            )
            self.har_dir.mkdir(parents=True, exist_ok=True)
            ctx.log.info(
                f"[har-per-test] listening on {LOOPBACK}:{self.control_port}, "
                f"output -> {self.har_dir}"
            )
        except Exception as exc:
            ctx.log.error(f"[har-per-test] could not start control server: {exc}")

    async def _handle_client(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
    ) -> None:
        try:
            line = await asyncio.wait_for(reader.readline(), timeout=2.0)
            if not line:
                return
            msg = json.loads(line.decode())
            action = msg.get("action", "")
            name = msg.get("name", "") or self.current_test or "unknown"

            if action == "start":
                self.current_test = name
                self.buffer.clear()
                response = {"status": "ok"}
            elif action == "end":
                path = self._dump(name)
                self.current_test = None
                self.buffer.clear()
                response = {"status": "ok", "path": str(path) if path else None}
            else:
                response = {"status": "error", "error": f"unknown action {action!r}"}

            writer.write((json.dumps(response) + "\n").encode())
            await writer.drain()
        except Exception as exc:
            try:
                err = {"status": "error", "error": str(exc)}
                writer.write((json.dumps(err) + "\n").encode())
                await writer.drain()
            except Exception:
                pass
        finally:
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass

    def _dump(self, name: str) -> Optional[Path]:
        if self.har_dir is None:
            return None
        if not self.buffer:
            # Don't create empty HAR files — there's nothing useful to look at,
            # and they make CI artifact listings noisier.
            ctx.log.info(f"[har-per-test] {name}: no flows captured, skipping")
            return None
        safe = _safe_filename(name)
        suffix = f"-shard-{self.shard}" if self.shard else ""
        path = self.har_dir / f"mitm{suffix}-{safe}.har"
        try:
            # save.har is the built-in command from mitmproxy.addons.savehar;
            # it serializes the provided flow sequence using the same logic
            # as the global `hardump` option, so per-test files have the same
            # schema as the fallback dump.
            ctx.master.commands.call("save.har", list(self.buffer), str(path))
            ctx.log.info(f"[har-per-test] wrote {path} ({len(self.buffer)} flows)")
            return path
        except Exception as exc:
            ctx.log.error(f"[har-per-test] failed to write {path}: {exc}")
            return None

    def response(self, flow) -> None:
        # Only buffer flows that completed during an active test window. Any
        # flow that happens outside of beforeEach/afterEach (setup, teardown,
        # idle traffic between specs) still ends up in the global hardump.
        if self.current_test is not None:
            self.buffer.append(flow)

    def server_connect(self, data) -> None:
        # data.server.address is (host, port). Rewriting it here, before
        # mitmproxy opens the upstream TCP socket, redirects the connect
        # without changing what the client sees over HTTP.
        addr = data.server.address
        if addr and addr[0] == EMULATOR_HOST_ALIAS:
            ctx.log.debug(
                f"rewriting upstream {EMULATOR_HOST_ALIAS}:{addr[1]} → {LOOPBACK}:{addr[1]}"
            )
            data.server.address = (LOOPBACK, addr[1])


addons = [LedgerLiveAddon()]

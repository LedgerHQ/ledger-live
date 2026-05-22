"""
mitmproxy addon for the Ledger Live Mobile Detox workflow.

Two responsibilities:

1. Rewrite the Android emulator host alias (10.0.2.2 → 127.0.0.1) on the
   upstream connection so mitmproxy (running on the host) can actually
   reach Detox bridge endpoints. Without it the bridge times out with
   "Connect call failed ('10.0.2.2', <port>)" and Detox can't talk to
   the in-app client.

2. Optional per-test HAR capture. Enabled when MITM_CONTROL_PORT and
   MITM_HAR_DIR are set. The addon then listens on
   127.0.0.1:$MITM_CONTROL_PORT for newline-delimited JSON messages and
   writes one HAR per test into ${MITM_HAR_DIR}/per-test/.

   Protocol:
     request  {"action":"start","name":"<test>"}
     response {"status":"ok"}                              (buffer cleared)

     request  {"action":"end","name":"<test>"}
     response {"status":"ok","flowCount":N,"path":"..."}   (path absent
                                                            if flowCount=0)

   Each Jest worker has its own mitmdump instance, so there's no cross-
   worker race on these commands. The HAR is written via mitmproxy's
   built-in `save.har` command using the same serializer as the global
   `hardump` option, so per-test files share that schema.

Run via e2e/mobile/scripts/mitm.sh. See e2e/mobile/helpers/mitm.ts for
how the lifecycle and control-port allocation are driven.
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
MAX_NAME_LEN = 120


def _safe_filename(name: str) -> str:
    # Filenames must be portable across Linux + macOS + zip archives —
    # collapse anything not alnum / dot / dash / underscore, and clip
    # length so paths don't blow past PATH_MAX or filesystem limits.
    sanitized = re.sub(r"[^\w.-]+", "_", name).strip("._-")[:MAX_NAME_LEN]
    return sanitized or "unknown"


class LedgerLiveAddon:
    def __init__(self) -> None:
        self.buffer: list = []
        self.current_test: Optional[str] = None
        self._server: Optional[asyncio.base_events.Server] = None

        self.har_dir: Optional[Path] = None
        har_dir = os.environ.get("MITM_HAR_DIR")
        if har_dir:
            self.har_dir = Path(har_dir) / "per-test"

        self.serial = os.environ.get("MITM_SERIAL", "")
        control_port = os.environ.get("MITM_CONTROL_PORT")
        self.control_port = int(control_port) if control_port else None

    async def running(self) -> None:
        # Per-test capture is gated on BOTH a control port and an output
        # dir. If either is missing we run as a plain proxy; the global
        # `hardump` option still produces a fallback HAR.
        if self.control_port is None or self.har_dir is None:
            ctx.log.info(
                "[per-test] disabled (control_port=%r, har_dir=%r)"
                % (self.control_port, self.har_dir)
            )
            return
        try:
            self._server = await asyncio.start_server(
                self._handle_client, LOOPBACK, self.control_port
            )
            self.har_dir.mkdir(parents=True, exist_ok=True)
            ctx.log.info(
                f"[per-test] listening on {LOOPBACK}:{self.control_port}, "
                f"serial={self.serial!r}, output -> {self.har_dir}"
            )
        except Exception as exc:
            ctx.log.error(f"[per-test] could not start control server: {exc}")

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
            name = msg.get("name") or self.current_test or "unknown"

            if action == "start":
                self.current_test = name
                self.buffer.clear()
                response = {"status": "ok"}
            elif action == "end":
                response = self._end_test(name)
                self.current_test = None
                self.buffer.clear()
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

    def _end_test(self, name: str) -> dict:
        flow_count = len(self.buffer)
        if flow_count == 0 or self.har_dir is None:
            # Skip empty captures — no point creating ~200-byte HAR shells
            # that pile up in CI artifacts and inflate Allure reports.
            if flow_count == 0:
                ctx.log.info(f"[per-test] {name}: no flows captured, skipping")
            return {"status": "ok", "flowCount": flow_count}

        safe = _safe_filename(name)
        prefix = f"{self.serial}-" if self.serial else ""
        path = self.har_dir / f"mitm-{prefix}{safe}.har"
        try:
            # save.har is the built-in command from mitmproxy.addons.savehar;
            # it serializes the provided flow sequence using the same logic
            # as the global `hardump` option, so per-test files have the same
            # schema as the fallback dump.
            ctx.master.commands.call("save.har", list(self.buffer), str(path))
            ctx.log.info(f"[per-test] wrote {path} ({flow_count} flows)")
            return {"status": "ok", "flowCount": flow_count, "path": str(path)}
        except Exception as exc:
            ctx.log.error(f"[per-test] failed to write {path}: {exc}")
            return {"status": "error", "error": str(exc), "flowCount": flow_count}

    def response(self, flow) -> None:
        # Only buffer flows that completed during an active test window.
        # Anything outside (app launch, beforeAll, idle time) still ends
        # up in the per-emulator global HAR written by the `hardump`
        # option.
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

"""
mitmproxy addon for Android-emulator host loopback.

The Android emulator uses 10.0.2.2 as a magic alias for the host's loopback.
When the in-emulator app sends a request through mitmproxy (running on the
host) for a destination on 10.0.2.2 — e.g. Detox's E2E bridge WebSocket —
mitmproxy faithfully tries to TCP-connect to 10.0.2.2 from the host's
network, where it is unreachable, producing
    [Errno 61] Connect call failed ('10.0.2.2', <port>)
and breaking the Detox bridge (Timeout while waiting for getEnvs, etc.).

This addon rewrites the upstream connection target from 10.0.2.2 to
127.0.0.1 so the proxy can actually reach whatever service is listening
on the host loopback. Tested with mitmproxy >= 9.

Usage:
    mitmweb -s e2e/mobile/scripts/mitm-emulator-addon.py
"""

from mitmproxy import ctx


EMULATOR_HOST_ALIAS = "10.0.2.2"
LOOPBACK = "127.0.0.1"


class EmulatorHostRewrite:
    def server_connect(self, data):
        # data.server.address is (host, port). Rewriting it here, before
        # mitmproxy opens the upstream TCP socket, redirects the connect
        # without changing what the client sees over HTTP.
        addr = data.server.address
        if addr and addr[0] == EMULATOR_HOST_ALIAS:
            ctx.log.debug(
                f"rewriting upstream {EMULATOR_HOST_ALIAS}:{addr[1]} → {LOOPBACK}:{addr[1]}"
            )
            data.server.address = (LOOPBACK, addr[1])


addons = [EmulatorHostRewrite()]

# @ledgerhq/live-dmk-ws-proxy-server

Server runtime for the DMK WebSocket proxy.

This package contains the host-side implementation used by `ledger-live proxy`:

- WebSocket server bootstrapping
- WebSocket server and client session lifecycle
- DMK HID discovery and APDU forwarding

It depends on `@ledgerhq/live-dmk-ws-proxy-shared` for protocol message types.

## Quick start

- Run `ledger-live proxy` (or `pnpm run:cli proxy`) on the host machine.
- The server prints one or more `DEVICE_PROXY_URL=ws://...` values.
- Configure that URL in Ledger Live Mobile debug connectivity settings (or via `DEVICE_PROXY_URL` env var).

## Scope

- Focused on real DMK + HID bridging behavior (discovery, connect/disconnect, APDU exchange).
- Replay/record runtime options from the legacy proxy implementation are intentionally not part of this package.

# @shared/proxy-websocket

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Creates Node WebSocket connections that respect standard proxy environment variables. It exposes a WebSocket factory that uses `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, and `NO_PROXY` without leaking its runtime dependencies to consumers.

## Exports

- `createProxyAwareWebSocketFactory` creates WebSocket connections through the applicable proxy.
- `resolveProxy` returns the proxy that applies to a target URL.

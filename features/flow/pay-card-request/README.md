# Pay Card Request

> [!CAUTION]
> **Status: UNSTABLE** — Scaffold only; public API is still being designed.

Dual-platform flow package that will host the Pay tab **Request receive-screen** experience for
Ledger Wallet: a shared view-model and receive-screen component (QR, truncated address, action
slot, shareable card) consumed by the platform presentations on desktop and mobile.

## Scope

This package is currently an **empty scaffold** created in
[LIVE-36094](https://ledgerhq.atlassian.net/browse/LIVE-36094). The receive-screen view-model and
component land in [LIVE-35187](https://ledgerhq.atlassian.net/browse/LIVE-35187) and its platform
tickets (LIVE-35188 / LIVE-35189). Until then the barrels only expose a compile-only placeholder.

## Platform resolution

Only views will carry a platform suffix (`.web` / `.native`). The container, view-model, and types
stay platform-agnostic and import without a suffix; TypeScript `moduleSuffixes`, the bundlers
(Rspack / Metro) and the jest preset resolve the right side.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-card-request/
├── package.json
└── src/
    ├── index.ts          # Public API barrel (web/default)
    ├── index.native.ts   # Public API barrel (native)
    └── placeholder.ts    # Compile-only placeholder (removed once real exports land)
```

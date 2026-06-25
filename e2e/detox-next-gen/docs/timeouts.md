---
name: detox-next-gen-timeouts
description: Read when choosing or overriding a wait timeout in the detox-next-gen Detox suite.
---

# Timeouts (`helpers/timeouts.ts`)

All wait durations are **speed tiers** — bound to *how long* an operation may take, not to
which feature needs it. One source of truth: `TIMEOUTS`.

| Tier | ms | Use for |
|---|---|---|
| `XS` | 15s | snappy native UI (the native default) |
| `S` | 30s | webview content settling (the web default) |
| `M` | 60s | a network round-trip (e.g. swap quotes) |
| `L` | 120s | signed-transaction processing / on-chain settlement |
| `XL` | 180s | a multi-minute on-device stream (e.g. account discovery) |

`POLL_INTERVAL` (500ms) is the gap between web polls.

## Rules

- **No inline `{ timeout: N }` literals.** Rely on the lib default (`XS` native, `S` web).
- Override **only** for genuinely slower operations, and use a tier — never a raw number.
- Expose the override as a method param default, e.g. `expectSuccess(timeout = TIMEOUTS.L)`.
- Pick the smallest tier that comfortably covers the operation's worst case.

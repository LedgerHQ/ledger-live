---
name: detox-next-gen-timeouts
description: Read when choosing or overriding a wait timeout in the detox-next-gen Detox suite.
---

# Timeouts (`helpers/timeouts.ts`)

All wait durations are **speed tiers** — bound to *how long* an operation may take, not to
which feature needs it. One source of truth: `TIMEOUTS`.

| Tier | ms | Use for |
|---|---|---|
| `XS` | 1s | the default for every call site (native **and** web) |
| `S` | 5s | first bump-up when `XS` proves too tight |
| `M` | 60s | a network round-trip (e.g. swap quotes) |
| `L` | 120s | signed-transaction processing / on-chain settlement |
| `XL` | 180s | a multi-minute on-device stream (e.g. account discovery) |

`POLL_INTERVAL` (500ms) is the gap between web polls.

## Rules

- **No inline `{ timeout: N }` literals.** Rely on the lib default (`XS`, for both native and web).
- Call sites default to `XS`; bump an individual one up a tier **only** once a flow proves it needs longer — and use a tier, never a raw number.
- Expose the override as a method param default, e.g. `waitForAnyQuote(timeout = TIMEOUTS.XS)`.
- Pick the smallest tier that comfortably covers the operation's worst case.

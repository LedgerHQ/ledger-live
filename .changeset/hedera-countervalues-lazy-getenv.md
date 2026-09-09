---
"@ledgerhq/coin-hedera": minor
---

Restore lazy runtime read of the countervalues API endpoint.

PR #21659 dropped the live-countervalues dependency and inlined the CVS spot-price call.
In doing so it replaced the per-call `getEnv("LEDGER_COUNTERVALUES_API")` with a
module-level `process.env` constant evaluated once at import time. The default URL was
always correct, but the mobile debug staging toggle (`CountervaluesStagingRow`) calls
`setEnv("LEDGER_COUNTERVALUES_API", ...)` at runtime; with a const that write is silently
ignored and Hedera fee estimation stays on production rates while every other CVS caller
follows the toggle.

Fix: read `getEnv("LEDGER_COUNTERVALUES_API")` inline at request time and re-add
`@ledgerhq/live-env` as a runtime dependency.

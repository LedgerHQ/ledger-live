---
"@ledgerhq/coin-stellar": patch
"@ledgerhq/live-common": patch
---

test: remove un-faked real timers from two unit suites (no production change)

- coin-stellar: stub `setTimeout` in `api/index_error.test.ts` so the 429-retry path no longer sleeps a real 4s, which raced Jest's 5s default timeout and intermittently failed CI (mirrors the existing `operationsFromHeight.unit.test.ts` stub).
- ledger-live-common: forward `global.setTimeout` with a 0ms delay in the `mock-bridges` suite, eliminating the ~78s of idle wall-clock spent on the mock bridge's simulated device latency (`scanAccounts`/`signOperation`/`sync`) while preserving async ordering.

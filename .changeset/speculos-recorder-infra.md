---
"@ledgerhq/live-dmk-speculos": patch
"@ledgerhq/ledger-key-ring-protocol": patch
---

Repair the speculos e2e recording pipeline:

- `live-dmk-speculos` now consumes the speculos `/events?stream=true` SSE feed and forwards events to `automationEvents`. The wiring had been silently dropped, so any scenario that drives on-device prompts (e.g. `pnpm lkrp e2e`) would stall waiting for button presses that never fired. The stream is opened lazily on first subscription and torn down when the last subscriber leaves, so APDU-only consumers (e.g. desktop e2e smoke tests) pay no socket cost. `automationEvents` is now an `Observable` rather than a `Subject` — existing `.subscribe()` / `.pipe()` consumers are unaffected.
- `ledger-key-ring-protocol`'s e2e runner script switches its dynamic scenario loader from `await import()` to `createRequire` so Node 22+ resolves the `.ts` scenario files through the ts-node CJS hook instead of the native ESM resolver.

---
"ledger-live-mobile-e2e-tests": patch
---

Centralize every mobile E2E duration in `e2e/mobile/utils/timeouts.ts`.

Two deliberately separate scales replace ~90 scattered magic numbers and per-file constants:

- `TIMEOUT` (upper bounds): `xxs` 500ms, `xs` 1s, `s` 5s, `m` 30s, `l` 1min, `xl` 2min, `xxl` 5min
- `INTERVAL` (poll cadences): `tick` 200ms, `short` 500ms, `medium` 1s, `long` 2s, `slow` 5s

Budgets whose duration no bucket describes stay named in the same file
(`BRIDGE_RESPONSE_TIMEOUT`, `COLD_START_DRAWER_TIMEOUT`, `ACCOUNT_DISCOVERY_TIMEOUT`,
`DETOX_SETUP_TIMEOUT`, the token-approval per-test budgets, …), so the suite has exactly
one place to look for a number.

`jest.config.js` and `detox.config.js` `require()` the same module — Node strips the types
at require time — so `testTimeout`, `setupTimeout`, `teardownTimeout` and
`debugSynchronization` no longer drift from the test code.

Removed the duplicate `DEFAULT_TIMEOUT` / `VISIBILITY_PROBE_TIMEOUT` /
`QUICK_VISIBILITY_PROBE_TIMEOUT` exports from `helpers/elementHelpers.ts`, and renamed the
`androidDelay` scroll parameter to `visibilityProbeTimeout` (it was a visibility timeout,
not a delay).

The harness tier is now separate from the test-facing scale, so runner and device budgets
can no longer be changed as a side effect of retuning a test wait: `TEST_TIMEOUT`,
`DETOX_TEARDOWN_TIMEOUT`, `DETOX_DEBUG_SYNCHRONIZATION`, `GLOBAL_*`, `SUITE_*` and the
diagnostic budgets each stand on their own.

Every element-helper wait now defaults to `TIMEOUT.s` (5s) instead of `TIMEOUT.l` (1min).
A wait only gets a larger budget when the call site asks for one, so a missing element
costs a fast failure rather than a minute of dead time. Visibility probes (`isIdVisible`,
`isIdPresent`) stay at `TIMEOUT.xs` (1s), since they answer "is this on screen now?" and
are usually paid in full when the answer is no.

This is backed by measurement rather than taste: a calibration run with every test-facing
bucket forced to 1s still passed 115 of 230 Android specs, so a 5s default leaves those
waits real headroom. Call sites that need longer — largely the webview-driven flows (swap,
buySell, earn) — pass an explicit bucket.

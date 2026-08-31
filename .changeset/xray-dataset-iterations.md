---
"@ledgerhq/live-e2e-shared": patch
"ledger-live-desktop-e2e-tests": patch
---

Report data-driven e2e results to Xray as dataset iterations

A coin can now be a dataset parameter of a single Xray test instead of needing its own B2CQA
ticket. The desktop reporter groups results by test key and emits one iteration per parameter
set, so a single failing coin shows red while the others stay green.

Also fixes three defects in the Xray export it touches: Playwright statuses are mapped to valid
Xray ones (`timedOut`/`interrupted`/`skipped` were sent verbatim and are not Xray statuses), a
missing TMS annotation no longer ships the literal string `Type not found` as a test key, and a
key shared by several tests aggregates FAILED-dominates instead of last-write-wins. The upload
step now fails loudly rather than exiting 0 on a rejected payload.

Xray replaces a Test Run's iterations on import instead of merging them, so a partial run would
wipe the rows already recorded and could turn a failing test green. The upload job is therefore
guarded to skip filtered runs.

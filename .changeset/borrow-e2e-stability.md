---
"ledger-live-desktop-e2e-tests": minor
"@ledgerhq/live-e2e-shared": minor
---

Make the Borrow desktop E2E suite independent and diagnosable: run the specs one at a time instead
of as a serial group so a failure no longer skips the remaining tests, click Give approval whenever
the control is on screen, wait on each marker's own visibility rather than a latching `or().first()`
locator, report the account's on-chain nonce when a flow fails instead of a generic funding hint,
and keep the on-chain flows on the primary device leg so parallel legs cannot collide on the shared
borrow account.

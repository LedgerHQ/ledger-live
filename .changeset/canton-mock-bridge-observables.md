---
"@ledgerhq/live-common": minor
---

Fix Canton mock bridge returning non-Observable stubs for `sync`, `receive`, `signOperation` and `scanAccounts`, which crashed `syncLegacyAccount` with `bridge.sync(...).pipe is not a function` for mock-typed Canton accounts. `scanAccounts` now reuses the shared `mockHelpers` generator.

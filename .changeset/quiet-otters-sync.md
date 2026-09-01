---
"@ledgerhq/coin-zcash": minor
"ledger-live-desktop": minor
---

Fix the Zcash shielded-balance "Stop sync" action, which previously did nothing when the
running sync was started automatically by the standard wallet sync rather than by the
manual start button, and could resume on its own shortly after a manual stop otherwise
succeeded.

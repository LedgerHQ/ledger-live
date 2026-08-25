---
"@ledgerhq/coin-zcash": patch
"ledger-live-desktop": patch
---

Fix missing memo in Zcash shielded operation details. After a shielded send with a memo, the memo is now persisted in the operation extra and displayed in Transaction details.

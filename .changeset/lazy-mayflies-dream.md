---
"@ledgerhq/coin-xrp": minor
---

Fix XRP operation listing to include non-Payment transactions received by the queried account (for example `AccountDelete` with `Destination` set to the account). Add unit and integration test coverage to ensure these transactions are returned as `IN` operations with correct sender, recipient, and fee payer.

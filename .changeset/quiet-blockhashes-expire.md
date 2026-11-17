---
"@ledgerhq/coin-solana": minor
"@ledgerhq/live-common": minor
"@ledgerhq/transaction-observability": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

When the node cannot find a Solana transaction's blockhash, report an expired blockhash as `SolanaTxBlockhashExpired`, shown as is in the send flows with wording that asks the user to try again, and simulate once more after 500 ms when the blockhash is still valid or its validity cannot be checked

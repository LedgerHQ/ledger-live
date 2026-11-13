---
"@ledgerhq/coin-solana": minor
"@ledgerhq/live-common": minor
"@ledgerhq/transaction-observability": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Simulate a Solana transaction once more after 500 ms when the node cannot find its blockhash, then report an expired blockhash as `SolanaTxBlockhashExpired`, shown as is in the send flows with wording that tells the user how to avoid it

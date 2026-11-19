---
"@ledgerhq/coin-solana": minor
"@ledgerhq/live-common": minor
"@ledgerhq/transaction-observability": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Check a Solana transaction's blockhash before simulating it and report an expired one as `SolanaTxBlockhashExpired`, shown as is in the send flows with wording that asks the user to try again. Durable-nonce transactions skip the check, and a simulation that cannot find the blockhash runs once more after 500 ms

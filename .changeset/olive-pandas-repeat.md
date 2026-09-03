---
"@ledgerhq/coin-solana": minor
"@ledgerhq/live-common": minor
"@ledgerhq/ledger-wallet-framework": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Enable the generic coin framework for Solana: the send and staking screens move onto the generic transaction shape, and the validation, fees, balances, operation types and transaction serialization the legacy bridge produced are restored on the generic path. A live app can again submit the four token and stake commands the wallet API defines.

Also affects Stellar: a pending operation now shows its memo, as the confirmed one already did.

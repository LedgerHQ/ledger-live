---
"@ledgerhq/live-common": minor
---

Swap cancellations report the same diagnostics for every insufficient funds error, including Cardano's and the ones raised at broadcast (Solana "Insufficient funds", XRP "Insufficient XRP balance to send."), and include the account's `maxSpendable`. The native balance and total fees are sent in display units, like the account balances. `enrichInsufficientFundsError` and `readInsufficientFundsDiagnostics` replace the NotEnoughGas and NotEnoughBalance helpers of `exchange/swap/completeExchange`.

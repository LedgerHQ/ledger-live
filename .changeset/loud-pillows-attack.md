---
"@ledgerhq/live-common": patch
"@ledgerhq/coin-evm": patch
"@ledgerhq/coin-tezos": patch
---

generic coin-framework bridge: compute the send-max (`useAllAmount`) amount once in `prepareTransaction` and reuse it in `signOperation`, instead of recomputing it via `validateIntent` in `prepareTransaction`, `signOperation` and `estimateMaxSpendable`. The amount is `parameters.amount` when the coin exposes it (Tezos), the token sub-account balance for token sends, otherwise `spendableBalance - max(reserve, fees)` (coin-evm now exposes `reserve`/`amountScale` for delegate). Pending operations are subtracted so the amount stays consistent with `getTransactionStatus` (LIVE-22227, LIVE-22228, LIVE-22229).

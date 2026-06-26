---
"@ledgerhq/live-common": patch
---

generic coin-framework bridge: compute the `useAllAmount` (send-max) amount once. `prepareTransaction` now derives the final amount from the single fee estimation (`parameters.amount` when the coin module provides it, e.g. Tezos, otherwise `spendableBalance - fees`), `signOperation` reuses that amount instead of recomputing it, and `estimateMaxSpendable` no longer calls `validateIntent`. `getTransactionStatus` still uses `validateIntent` for errors/warnings, so the displayed amount is unchanged (LIVE-22227, LIVE-22228, LIVE-22229).

---
"@ledgerhq/coin-polkadot": patch
---

Fix the `operations` API on Asset Hub networks: let the indexer client pick its page size (the indexer rejects `limit=0`), stop returning a `next` cursor that no request honors, and use a zero fee when the indexer omits `partialFee` on fee-free extrinsics instead of returning `NaN` amounts

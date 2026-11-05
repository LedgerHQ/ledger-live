---
"@ledgerhq/coin-algorand": minor
---

Support `getBlock` in the Algorand coin module: read the transactions of a round from the indexer and map their payments and asset transfers, inner transactions included, to block operations with their fees and fee payer. `getBlockInfo` and `lastBlock` now return the block hash and its parent instead of the genesis hash.

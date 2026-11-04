---
"@ledgerhq/coin-multiversx": minor
---

Support `getBlock` and `getBlockInfo` in the MultiversX coin module. A block height is a metachain round, as in `lastBlock` and `listOperations`: `getBlock` reads every transaction of the round across shards and maps its EGLD value, the EGLD, ESDT and NFT transfers made by smart contracts (`EGLD-000000` multi-transfers as native), local mints and burns, and protocol rewards to block operations, with their fees and fee payer (the relayer of a relayed transaction). A round with a pending transaction is rejected with `MultiversXRoundNotFinal` so that it is read again once final. `lastBlock` now returns the time of the latest metachain round instead of the current time.

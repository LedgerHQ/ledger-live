---
"@ledgerhq/coin-concordium": minor
---

Migrate getBlockInfo from gRPC to wallet-proxy REST endpoints (/v0/blocksAtHeight, /v0/blockInfo), removing gRPC dependency from the block info flow.

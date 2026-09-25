---
"@ledgerhq/coin-bitcoin": minor
---

coin-bitcoin Alpaca `createApi`: add `getBlock` / `getBlockInfo`, and rework `listOperations` into a
height-windowed, batched pager that fetches a page WITHOUT resyncing the whole account history. It
drives the explorer's JSON-RPC batch endpoint (`POST /rpc`) with a per-address REST fallback for
explorers that lack it (e.g. regtest), uses a single scalar cursor (block height + boundary op id +
address horizon), and honours `order` (asc/desc), `minHeight`, pending (0-conf) operations, and
`config.explorer.uri`. `combine` now rejects anything other than exactly one signed PSBT
(single-signature contract, matching the other coin-modules).

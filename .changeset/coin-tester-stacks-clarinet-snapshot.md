---
"@ledgerhq/coin-tester-stacks": patch
---

perf: boot the devnet from Clarinet's epoch-4.0 snapshot on Clarinet v3.24.1

The devnet booted from genesis (burn height 100) and waited for epoch 3.0 and 4.0 at 10s blocks
before the send and staking scenarios could run. Clarinet ships a chain-state snapshot that starts
at burn height 163, past epoch 4.0, but rejected ours because `Devnet.toml` lacked its default
`stacker` stacking order, and our pinned Clarinet could not deploy project contracts on a snapshot
boot (fixed upstream in v3.24.0, stx-labs/clarinet#2529).

The patched Clarinet build also redirected the stacks-node's burnchain RPC straight to bitcoind.
That port is Clarinet's own Bitcoin RPC proxy, which mines the next block whenever it relays a
miner's block-commit; bypassing it is what stalled mining and required the external
`bitcoin-miner.js` workaround, now opt-in only.

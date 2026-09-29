---
"@ledgerhq/coin-tester-stacks": patch
---

fix: start the bitcoin mining workaround when the stacks-node RPC comes up

`stacks-blockchain-api` 9.3.0 blocks its own startup until the stacks-node answers
`/v2/pox`, which needs a first Stacks block, which needs a Bitcoin block only the
workaround miner produces. Starting the miner only after API readiness deadlocked
every boot since `hirosystems/stacks-blockchain-api:latest` moved to 9.3.0; starting
it at node-RPC-up unblocks the API without racing past the block #110 window in
which Clarinet publishes the devnet's stacking orders.

---
"@ledgerhq/coin-hedera": patch
---

fix(coin-hedera): match an ERC20 transfer to its contract call by hash

`enrichERC20Transfers` found the mirror node transaction of an Hgraph ERC20 transfer by taking the first contract call of the payer within ±10 µs of the transfer. When the payer made two contract calls less than 10 µs apart, both transfers went to the later call: `getBlock` returned that transaction twice and the earlier one without its ERC20 transfer. The contract call is now the one whose hash starts with the transfer's EVM transaction hash.

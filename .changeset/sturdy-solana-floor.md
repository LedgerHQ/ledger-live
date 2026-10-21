---
"@ledgerhq/coin-solana": patch
"@ledgerhq/live-common": patch
"@ledgerhq/coin-tester-solana": patch
---

fix(coin-solana): clamp the compute-unit price to a minimum floor (`minPriorityFee`, default 10,000 microLamports/CU) instead of sending unpriced transactions, and sign the fee the user approved: `estimateFees` prices the transaction `craftTransaction` builds and publishes its compute-unit price and limit, which crafting reuses, keeping the larger limit if the transaction grew in between (live-common forwards them). Also simulates compute units with the price instruction, includes the priority fee in every fallback used when the fee RPC fails, fixes the priority-fee median swapping its odd and even cases, and fixes the Solana mock bridge recursing forever on `api.config`

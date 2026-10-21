---
"@ledgerhq/coin-solana": patch
"@ledgerhq/live-common": patch
"@ledgerhq/coin-tester-solana": patch
---

fix(coin-solana): clamp the compute-unit price to a minimum floor (`minPriorityFee`, default 10,000 microLamports/CU, also used when the configured value is not positive) instead of sending unpriced transactions. Also simulates compute units with the price instruction, estimates a native transfer with its memo (whose compute units the price now charges), makes the priority-fee median return the middle sample for an odd count and the average of the two middle samples for an even count, fixes the Solana mock bridge recursing forever on `api.config`, and adapts the coin tester's staking checks to the priority fee

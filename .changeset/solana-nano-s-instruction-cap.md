---
"@ledgerhq/coin-solana": minor
---

fix(coin-solana): keep transactions within the 4 instructions the Nano S app parses, by leaving out the compute-unit limit when it and the price don't both fit (a stake creation with its delegation, a token transfer creating the recipient account with a memo), instead of requiring blind signing

---
"@ledgerhq/coin-tron": patch
---

getBlock reads TRC20 transfers from the Transfer events of every smart contract call (swaps, transferFrom, payouts, airdrops) and maps approve() calls to an APPROVE operation (BACK-11822)

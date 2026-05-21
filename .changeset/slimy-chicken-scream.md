---
"@ledgerhq/coin-tezos": patch
---

Fall back to requestedAmount (or 0) when parsing failed staking operations from TzKT. Failed stake ops return only requestedAmount and no amount field;
BigInt(undefined) was throwing and stalling account sync on any account that has a failed staking operation in its history.

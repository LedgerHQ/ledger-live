---
"@ledgerhq/coin-hedera": patch
"@ledgerhq/live-common": patch
---

fix(coin-hedera): split a native operation's HBAR change like getBlock does

`listOperations` now derives each native value from the account's transfer plus the fees it paid, as `getBlock` does, so an indexer summing either one gets the account's on-chain HBAR change. A contract call that paid HBAR back to its fee payer stays outgoing, with a negative value. An IN the account paid for counts the fee, which the Live Hedera adapter takes back out. Someone else's contract call that only credited the account becomes an IN. Live's A4 reader gives a negative value to a native credit of an outgoing-like operation, so such a contract call shows as a credit there too.

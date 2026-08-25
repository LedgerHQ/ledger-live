---
"@ledgerhq/coin-evm": patch
---

fix(evm): bound the Ledger explorer's fetch-all pagination and stop re-copying the accumulator

`fetchPaginatedOpsWithRetries` recursed for as long as the explorer returned a continuation token,
with no cap, and rebuilt the whole accumulator on every batch (`[...previous, ...batch]`). On very
large addresses that exhausted the V8 heap and took the app down with `Ineffective mark-compacts
near heap limit`.

Batches are now appended in place, and the number of operations accumulated per address is capped
(`DEFAULT_MAX_OPERATIONS`, overridable per network via `explorer.maxOperations`). Hitting the cap
truncates the history and logs it rather than throwing. `coin-stellar` and `coin-tezos` already
bound their equivalent loops this way.

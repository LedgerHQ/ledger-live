---
"@ledgerhq/coin-bitcoin": patch
"@ledgerhq/ledger-wallet-framework": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

fix(coin-bitcoin): do not spend the inputs of pending operations

`prepareTransaction` and `estimateMaxSpendable` exclude the UTXOs spent by the account's own
pending operations. When the explorer does not report mempool spends, a sync listed them as
spendable again and the next send was rejected with `txn-mempool-conflict`. An RBF edit keeps
the inputs of the operation it replaces.

`addPendingOperation` keeps every pending UTXO operation (those with `extra.inputs`) instead of
only the latest one, and removes one only when the new operation spends one of its inputs (an RBF
replacement). Operations of other coins are unchanged.

`isOldestBitcoinPendingOperation` takes the operation instead of its date: a pending operation
can be sped up unless it spends an output of another unconfirmed operation of the account. Pending
sends of unrelated UTXOs no longer block each other's speed-up.

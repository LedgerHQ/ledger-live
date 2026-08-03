---
"@ledgerhq/coin-solana": patch
---

Fix incorrect Solana max spendable amount while a previous send is still pending.

`estimateMaxSpendable` derived the spendable amount from the synced `account.spendableBalance`, which is computed purely from the on-chain balance. Right after a send, the outgoing transaction is still unconfirmed, so the on-chain balance (and thus `spendableBalance`) does not yet reflect it — and `addPendingOperation` only appends to `pendingOperations` without decrementing the balance. As a result, a "send max" started right after another send used an inflated balance and failed at broadcast (`SolanaTxSimulationFailedWhilePendingOp`).

- `estimateMaxSpendable` now subtracts pending outgoing operations (amount + fees) from the spendable balance.
- The `estimateMaxSpendable` LRU cache key now includes the account's pending operations, so a fresh outflow busts the cache instead of returning a stale pre-outflow value.

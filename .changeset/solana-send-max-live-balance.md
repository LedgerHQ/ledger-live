---
"@ledgerhq/coin-solana": patch
---

Fix Solana "send max" overshooting the balance right after a native outflow (e.g. a swap or two sends in a row before the account re-syncs). The synced balance is only decremented on the next full sync, so the max-spendable was computed from a stale balance and the transaction failed at broadcast with "Insufficient funds". `estimateMaxSpendable` now fetches the live on-chain balance (re-applying the same rent-exempt and unstake reservations as sync) instead of relying on the synced `spendableBalance`. Its LRU cache key also now includes the account's pending operations, so a fresh outflow busts the cache instead of returning a stale pre-outflow max-spendable value keyed on the not-yet-updated `spendableBalance`.

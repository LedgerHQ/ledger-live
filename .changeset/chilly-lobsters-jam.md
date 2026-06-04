---
"@ledgerhq/coin-tron": patch
---

Fix: include operations for failed transactions instead of discarding them, so downstream consumers (A4, lama-adapter) can see transfer details (asset, amount, sender, recipient) while using the `failed` flag to exclude them from balance computation.

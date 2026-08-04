---
"@ledgerhq/live-wallet": patch
"@features/platform-wallet-sync": patch
"@shared/cloud-sync-module": patch
"@domain/entity-account-name": patch
"@domain/entity-recent-addresses": patch
---

Delegate live-wallet internals to the DDD packages without changing its public API: cloudsync now re-exports `@shared/cloud-sync` (native fetch transport), account naming re-exports `@domain/entity-account-name`, the accountNames and recentAddresses sync modules re-export their `@domain/entity-*` counterparts, and the watch loop, incremental updates and trustchain lifecycle re-export `@features/platform-wallet-sync`. Removes ~2700 lines of duplicated implementation and tests.

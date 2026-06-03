---
"@ledgerhq/coin-evm": patch
"@ledgerhq/live-common": patch
---

refactor(coin-evm): replace the homemade validators cache with `makeLRUCache` and drop the redundant `inFlightFetches` map

The EVM staking validators cache now uses `@ledgerhq/live-network/cache`'s `makeLRUCache`. Because it stores the in-flight promise, concurrent fetches are coalesced by the cache itself, so the separate `inFlightFetches` request-deduplication map and the synchronous `getCachedValidators` accessor were removed.

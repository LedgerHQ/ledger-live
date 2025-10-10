# @ledgerhq/live-persistence


This library provides generic persistent key-value cache implementations that can be used across different Ledger Live applications.

**Key features:**

- key-value persistent cache
- universal and works on all platforms
- TTL for refresh
- TTL for eviction
- cleanup of old cache entries
- store a version with the data to support migrations at higher levels

Current implementations:

- **Memory (`createMemoryCacheAdapter`)**: In-memory cache for testing and development
- **IndexedDB (`createIndexedDBCacheAdapter`)**: Web-based persistent storage
- **MMKV (`createMMKVCacheAdapter`)**: React Native persistent storage
- **No-op (`noopCacheAdapter`)**: Dummy implementation for testing

> For implementations, please to not depends on libs at this lib level, prefer to inject the lib as a parameter like we did for MMKV.

```typescript
interface CacheAdapter<T = unknown> {
  get(key: string): Promise<CacheEntry<T> | null>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  cleanupExpired(): Promise<number>;
}

import { createMemoryCacheAdapter } from "@ledgerhq/live-persistence/implementations/memory";

const cache = createMemoryCacheAdapter({
  ttl: 3600, // 1 hour
  refreshTtl: 900, // 15 minutes
  version: 1
});

await cache.set("key", "value");
const value = await cache.get("key");
```

## Higher levels integrations

### rtk-query integration

The library is meant to easily be integrated with RTK Query which is becoming our standard in Ledger Live.

Currently used to implement:
- [CryptoAssetsStore interface](/libs/ledgerjs/packages/cryptoassets/src/rtk-store/api.ts)

```typescript
const cacheAdapter = ...;
// Basic TLDR: Create a RTK Query API using the persistent base query and your cache

const cryptoAssetsApi = createApi({
  reducerPath: "cryptoAssetsApi",
  baseQuery: createPersistentBaseQuery({
    baseUrl: CAL_API,
    cacheAdapter,
    clientVersion: "1.0.0",
    validateAndTransformResponse: resp => validateHttpResp(resp),
  }),
  endpoints: builder => ({
    findTokenById: builder.query<TokenCurrency | undefined, { id: string }>({
      query: params => ({
        url: "/v1/tokens",
        params: { id: params.id, limit: "1", ... }
      }),
    }),
  }),
});

const { useFindTokenByIdQuery } = cryptoAssetsApi;
const { data: token } = useFindTokenByIdQuery({ id: tokenId });
...
```

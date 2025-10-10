# Platform-Specific Cache Implementations

This folder contains pluggable cache implementations for different platforms. Each implementation follows the same interface and can be easily swapped based on the target platform.

## Available Implementations

### Memory Cache (`memory.ts`)
- **Platform**: Universal (fallback/testing)
- **Storage**: In-memory Map
- **Use case**: Testing, fallback, or when persistence is not needed

### IndexedDB (`indexed-db.web.ts`)
- **Platform**: Web browsers
- **Storage**: IndexedDB
- **Use case**: Web applications requiring persistent caching

### MMKV (`mmkv.native.ts`)
- **Platform**: React Native
- **Storage**: MMKV (fast key-value storage)
- **Use case**: React Native applications requiring fast persistent storage

### No-op (`noop.ts`)
- **Platform**: Universal
- **Storage**: None (no-op)
- **Use case**: Testing or when caching should be disabled

## Usage Examples

### Web Application (IndexedDB)

```typescript
import { createCryptoAssetsApi } from "@ledgerhq/cryptoassets/rtk-store";
import { createIndexedDBCacheAdapter } from "@ledgerhq/cryptoassets/rtk-store/persistent-cache/implementations/indexed-db.web";

const cacheAdapter = createIndexedDBCacheAdapter("my-app-cache", "tokens");
const api = createCryptoAssetsApi({
  baseUrl: "https://api.example.com",
  cacheAdapter,
  cacheTtl: 24 * 60 * 60, // 24 hours
  refreshTtl: 4 * 60 * 60, // 4 hours
  cacheVersion: 1, // Cache version for schema changes
  clientVersion: "2.130.0",
});
```

### React Native Application (MMKV)

```typescript
import { createCryptoAssetsApi } from "@ledgerhq/cryptoassets/rtk-store";
import { createMMKVCacheAdapter } from "@ledgerhq/cryptoassets/rtk-store/persistent-cache/implementations/mmkv.native";

const cacheAdapter = createMMKVCacheAdapter(mmkvInstance, "crypto-assets-cache:");
const api = createCryptoAssetsApi({
  baseUrl: "https://api.example.com",
  cacheAdapter,
  cacheTtl: 24 * 60 * 60, // 24 hours
  refreshTtl: 4 * 60 * 60, // 4 hours
  cacheVersion: 1, // Cache version for schema changes
  clientVersion: "2.130.0",
});
```

### Testing (Memory Cache)

```typescript
import { createCryptoAssetsApi } from "@ledgerhq/cryptoassets/rtk-store";
import { createMemoryCacheAdapter } from "@ledgerhq/cryptoassets/rtk-store/persistent-cache/implementations/memory";

const cacheAdapter = createMemoryCacheAdapter();
const api = createCryptoAssetsApi({
  baseUrl: "https://api.example.com",
  cacheAdapter,
  cacheTtl: 60, // 1 minute for testing
  refreshTtl: 30, // 30 seconds for testing
  cacheVersion: 1, // Cache version for schema changes
  clientVersion: "2.130.0",
});
```

## Interface

All implementations follow the same `CacheAdapter` interface:

```typescript
interface CacheAdapter<T = unknown> {
  get(key: string): Promise<CacheEntry<T> | null>;
  set(key: string, value: T, ttl: number, refreshTtl: number, version?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  cleanupExpired(): Promise<number>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  refreshAt: number;
  ttl: number;
  version: number;
}
```

## Cache Behavior

- **TTL**: When data is evicted from cache
- **Refresh TTL**: When data is considered stale and should be refreshed
- **Version**: Cache versioning for schema changes
- **Error handling**: All implementations fail gracefully to avoid breaking the main application flow

## Adding New Implementations

To add a new platform-specific implementation:

1. Create a new file in this folder (e.g., `local-storage.web.ts`)
2. Implement the `CacheAdapter` interface
3. Export the implementation and any required factory functions
4. Add the export to `index.ts`
5. Update this README with usage examples

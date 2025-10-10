# @ledgerhq/live-persistence

This library provides Redux-level persistence utilities for RTK Query in Ledger Live applications.

## Features

### RTK Query Redux-Level Persistence

Provides utilities to persist RTK Query state at the Redux level, enabling:

- Debounced saves to storage (IndexedDB/MMKV) when RTK Query state changes
- Hydration of RTK Query cache on app startup
- TTL-based cache management
- Efficient storage by only persisting fulfilled queries

## Usage

### Desktop (IndexedDB)

**In your Redux middleware:**

```typescript
import { 
  createRtkQueryStateSelector, 
  shouldPersist,
  saveRtkQueryStateToIndexedDB 
} from "@ledgerhq/live-persistence";
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client";

// Create selector for extracting cacheable state
// Only cache token lookup queries, not sync hash or infinite queries
const cryptoAssetsStateSelector = createRtkQueryStateSelector(
  cryptoAssetsApi,
  undefined,
  ["findTokenById", "findTokenByAddressInCurrency"]
);
let lastPersistedState = null;

// In your middleware:
if (action.type.startsWith(cryptoAssetsApi.reducerPath + "/")) {
  next(action);
  const state = store.getState();
  const cacheState = cryptoAssetsStateSelector(state);
  
  // Only persist if state has actually changed
  if (shouldPersist(lastPersistedState, cacheState)) {
    lastPersistedState = cacheState;
    // Save to dedicated IndexedDB (non-blocking, no IPC overhead)
    saveRtkQueryStateToIndexedDB(cacheState).catch(error => {
      console.error("Failed to persist:", error);
    });
  }
}
```

**On app startup, hydrate with cross-caching:**

```typescript
import { 
  hydrateRtkQueryCache,
  loadRtkQueryStateFromIndexedDB 
} from "@ledgerhq/live-persistence";

// Load from dedicated IndexedDB
const cachedState = await loadRtkQueryStateFromIndexedDB();

// Hydrate with automatic cross-caching
hydrateRtkQueryCache(cryptoAssetsApi, store.dispatch, cachedState);
```

**Why IndexedDB directly?** Desktop uses a dedicated IndexedDB database (`ledger-live-crypto-assets`) instead of the legacy `app.json` system. This provides:
- ✅ No IPC overhead (direct browser API access)
- ✅ Better performance (asynchronous, non-blocking writes)
- ✅ Separation of concerns (crypto assets cache independent from app settings)

**Automatic Cross-Caching:** Token data can be fetched two ways:
- By ID: `findTokenById({ id: "ethereum/erc20/usdc" })`
- By Address: `findTokenByAddressInCurrency({ contract_address: "0x...", network: "ethereum" })`

Even though they return the same token, RTK Query creates different cache keys. The `hydrateRtkQueryCache` utility **automatically detects tokens** and caches them under BOTH keys, ensuring both access patterns benefit from the cache and avoiding redundant network requests. No configuration needed!

### Mobile (MMKV)

#### Option 1: Direct Storage (Current Approach)

Mobile currently uses its own storage abstraction directly:

```typescript
import storage from "LLM/storage";

// Load
const state = await storage.get("cryptoAssetsCache");

// Save  
await storage.save("cryptoAssetsCache", state);
```

This works fine and doesn't need to change.

#### Option 2: Unified CacheAdapter Approach (Optional)

To benefit from TTL management and unified architecture, you can use the CacheAdapter:

```typescript
import { createMMKVReduxStatePersistence } from "@ledgerhq/live-persistence";
import { MMKV } from "react-native-mmkv";

// Create MMKV instance
const mmkv = new MMKV();

// Create persistence with TTL support
const persistence = createMMKVReduxStatePersistence(mmkv);

// Use it
await persistence.save(cryptoAssetsState);
const state = await persistence.load(); // Returns null if expired
```

**Benefits of Option 2:**
- ✅ Automatic expiration of old cache (TTL)
- ✅ Same architecture as Desktop
- ✅ Versioning support for schema changes
- ✅ Easy to test (can swap with Memory adapter)

## API

### `createRtkQueryStateSelector(api, ttl?, endpointFilter?)`

Creates a selector that extracts only the cacheable state from an RTK Query API.

**Parameters:**
- `api`: The RTK Query API instance
- `ttl`: Optional TTL in milliseconds (defaults to api.config.keepUnusedDataFor)
- `endpointFilter`: Optional array of endpoint names to cache. If not provided, all endpoints are cached.

**Example:**
```typescript
// Only cache specific endpoints
const selector = createRtkQueryStateSelector(
  cryptoAssetsApi,
  undefined, // use default TTL
  ["findTokenById", "findTokenByAddressInCurrency"] // only cache these queries
);
```

**Returns:**
A selector function that takes the Redux state and returns:
```typescript
{
  queries: Record<string, CachedQuery>;
  provided: Record<string, any>;
}
```

### `parseSerializedCacheKey(cacheKey)`

Parses an RTK Query cache key back into its endpoint name and arguments.

**Parameters:**
- `cacheKey`: String like `'findTokenById({"id":"ethereum/erc20/usdc"})'`

**Returns:**
```typescript
{
  endpointName: string;
  originalArgs: any;
}
```

### `hydrateRtkQueryCache(api, dispatch, persistedState, enableCrossCaching?)`

Hydrates RTK Query cache from persisted state with automatic cross-caching for token data.

**Parameters:**
- `api`: The RTK Query API instance
- `dispatch`: Redux dispatch function (must support thunks)
- `persistedState`: The persisted cache state to hydrate from
- `enableCrossCaching`: Optional boolean to enable/disable cross-caching (default: `true`)

**Example:**
```typescript
// Simple usage with automatic cross-caching
hydrateRtkQueryCache(cryptoAssetsApi, store.dispatch, cachedState);

// Or disable cross-caching if needed
hydrateRtkQueryCache(cryptoAssetsApi, store.dispatch, cachedState, false);
```

**What it does:**
- ✅ Parses cache keys and restores all cached queries
- ✅ **Automatically detects** token data (checks for `id`, `contractAddress`, `parentCurrency.id`)
- ✅ Cross-caches tokens under both `findTokenById` and `findTokenByAddressInCurrency` keys
- ✅ Error handling and logging

**How it detects tokens:** Looks for objects with these fields:
```typescript
{
  id: string;
  contractAddress: string;
  parentCurrency: { id: string };
}
```
If found, the token is automatically cached under both access patterns!

### `shouldPersist(oldState, newState)`

Checks if two persisted states are different to avoid unnecessary writes.

**Returns:**
`true` if states differ significantly

### `filterStaleQueries(queries, ttl)`

Filters out queries that are older than the specified TTL.

### IndexedDB Utilities (Desktop)

#### `createIndexedDBStorage(dbName, storeName?)`

Creates a simple key-value storage backed by IndexedDB. This is a generic utility that can be used for any JSON-serializable data.

**Parameters:**
- `dbName`: Name of the IndexedDB database
- `storeName`: Optional name of the object store (defaults to "state")

**Returns:**
An object with methods:
- `get<T>(key: string): Promise<T | null>` - Retrieve a value
- `set<T>(key: string, value: T): Promise<void>` - Store a value
- `delete(key: string): Promise<void>` - Delete a value

**Example:**
```typescript
const storage = createIndexedDBStorage("my-app-data");
await storage.set("user-preferences", { theme: "dark" });
const prefs = await storage.get("user-preferences");
```

#### Convenience Functions

For crypto assets specifically, these pre-configured functions are available:

- `loadRtkQueryStateFromIndexedDB()` - Loads crypto assets cache
- `saveRtkQueryStateToIndexedDB(state)` - Saves crypto assets cache  
- `clearRtkQueryStateFromIndexedDB()` - Clears crypto assets cache

These are just shortcuts for:
```typescript
const storage = createIndexedDBStorage("ledger-live-crypto-assets");
storage.get("cache");
storage.set("cache", state);
storage.delete("cache");
```

## Architecture

### Unified Approach: CacheAdapter Interface

All persistence implementations use the same **`CacheAdapter<T>`** interface, providing:
- ✅ Automatic TTL management (expires old data)
- ✅ Timestamps and versioning
- ✅ Same API across platforms (IndexedDB, MMKV, Memory)

### Two Layers

1. **CacheAdapter Layer** (low-level)
   - Generic key-value storage with TTL
   - Platform-specific implementations: `createIndexedDBCacheAdapter`, `createMMKVCacheAdapter`
   - Stores `CacheEntry<T>` with metadata (timestamp, expiresAt, version)

2. **Redux State Bridge** (high-level)
   - `createReduxStatePersistence(adapter)` - Works with ANY CacheAdapter
   - Loads/saves RTK Query state using the adapter
   - Platform-agnostic (same code for Desktop and Mobile)

### Example: Custom Platform

Want to add a new platform? Just implement a `CacheAdapter` and plug it in:

```typescript
import { createReduxStatePersistence, CacheAdapter } from "@ledgerhq/live-persistence";

// Your custom adapter (could be localStorage, file system, etc.)
const myAdapter: CacheAdapter<PersistedRtkQueryState> = {
  ttl: 30 * 24 * 60 * 60,
  refreshTtl: 7 * 24 * 60 * 60,
  version: 1,
  get: async (key) => { /* ... */ },
  set: async (key, value) => { /* ... */ },
  delete: async (key) => { /* ... */ },
  clear: async () => { /* ... */ },
  cleanupExpired: async () => { /* ... */ },
};

// Create persistence with your adapter
const persistence = createReduxStatePersistence(myAdapter);

// Use it
await persistence.save(state);
const state = await persistence.load();
```

### Why Redux-Level (not Query-Level)?

1. **Performance**: Debounced batch writes instead of per-query I/O
2. **Simplicity**: One persistence mechanism for all Redux state
3. **Native RTK Query**: Leverages RTK Query's built-in caching and deduplication
4. **Platform Agnostic**: Same logic works with any CacheAdapter

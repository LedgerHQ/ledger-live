# RTK Query Crypto Assets Store

RTK Query-based implementation for crypto assets data fetching with persistent caching.

## Quick Start

### The RTK Query way

```typescript
import { createCryptoAssetsApi } from "@ledgerhq/cryptoassets/rtk-store";
import { createIndexedDBCacheAdapter } from "@ledgerhq/live-persistence";

const cacheAdapter = createIndexedDBCacheAdapter(
  {
    ttl: 24 * 60 * 60, // 24 hours - when to evict from cache
    refreshTtl: 4 * 60 * 60, // 4 hours - when to refresh in background
    version: 1, // Cache version for schema changes
  },
  "crypto-assets-cache",
  "tokens",
);

const cryptoAssetsApi = createCryptoAssetsApi({
  baseUrl: "https://crypto-assets.api.live.ledger.com",
  cacheAdapter,
  clientVersion: "2.130.0",
});

// Use with Redux store
const store = configureStore({
  reducer: {
    [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cryptoAssetsApi.middleware),
});

// Use the generated hooks (in React context)
const { useFindTokenByIdQuery, useFindTokenByAddressInCurrencyQuery } = cryptoAssetsApi;
const { data: token, isLoading, error } = useFindTokenByIdQuery("ethereum/erc20/usd_coin");
const {
  data: token,
  isLoading,
  error,
} = useFindTokenByIdQuery("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "ethereum");
```

### CryptoAssetsStore compatibility

In a coin integration context that is not in React, you will use the crypto assets store. It can be generated from above.

```typescript
const rtkCryptoAssetsStore = createRtkCryptoAssetsStore(cryptoAssetsApi, store.dispatch);

const token = await rtkCryptoAssetsStore.findTokenById("ethereum/erc20/usd_coin");

const anotherToken = await rtkCryptoAssetsStore.findTokenByAddressInCurrency(
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "ethereum",
);
```

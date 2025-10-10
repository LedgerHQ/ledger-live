<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

## @ledgerhq/cryptoassets

Ledger's material for crypto currencies, tokens and fiats. Also includes signatures required by Nano devices for these tokens.

This library provides dynamic RTK Query-based token lookup capabilities through the **CAL (Crypto Assets List) Client**. The previously included static crypto asset data is deprecated and will be removed soon.

> **NB: @ledgerhq/cryptoassets library will soon move to the top level `libs/` as it is no longer needed among ledgerjs libraries.**

## CAL Client

The **CAL (Crypto Assets List) Client** is the main interface for fetching and managing token data dynamically via API.

**Key features:**
- 🚀 Dynamic token data fetching via CAL API
- 📦 RTK Query integration for efficient caching and state management
- 🔄 Infinite scroll pagination support
- ⚡ Environment-aware with `getEnv()` integration
- 🔍 Multiple lookup methods (by ID, address, network)

**📚 [See the complete CAL Client documentation →](./src/cal-client/README.md)**

### Quick Example

```typescript
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client";
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";

// Setup Redux store
const store = configureStore({
  reducer: {
    [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cryptoAssetsApi.middleware),
});

// Use in components
function TokensList() {
  const { data, isLoading, loadNext } = useTokensData({
    networkFamily: ["ethereum"],
  });
  // ... render tokens
}
```

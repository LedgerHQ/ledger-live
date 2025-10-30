# CAL Client

**CAL** stands for **Crypto Assets List** - a data management system for fetching and managing token data across different blockchain networks.

## Installation

The CAL client is included in `@ledgerhq/cryptoassets`

## Usage Examples

### Basic Usage with React

```typescript
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";

// Fetch tokens data
const TokensList = () => {
  const { data, isLoading, error, loadNext, isSuccess } = useTokensData({
    networkFamily: ["ethereum", "polygon"],
    pageSize: 100,
    isStaging: false,
  });

  if (isLoading) return <div>Loading tokens...</div>;
  if (error) return <div>Error loading tokens</div>;

  return (
    <div>
      {data?.tokens.map(token => (
        <div key={token.id}>
          <span>{token.name} ({token.ticker})</span>
          <span>Contract: {token.contractAddress}</span>
          <span>Network: {token.parentCurrency.name}</span>
        </div>
      ))}
      {loadNext && <button onClick={() => loadNext()}>Load More</button>}
    </div>
  );
};
```

### Desktop Integration (Redux)

```typescript
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client";

// Configure Redux store
const store = configureStore({
  reducer: {
    // ... other reducers
    [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cryptoAssetsApi.middleware),
});
```

The `cryptoAssetsApi` instance is pre-configured and environment-aware. It automatically uses `getEnv()` to fetch:

- `CAL_SERVICE_URL` - Base URL for the CAL API
- `LEDGER_CLIENT_VERSION` - Client version for request headers

No manual configuration is needed!

### Advanced Usage with Pagination

```typescript
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";

const InfiniteTokensList = () => {
  const {
    data,
    isLoading,
    loadNext,
    refetch
  } = useTokensData({
    networkFamily: "ethereum",
    pageSize: 100,
    output: ["id", "name", "ticker", "contract_address"],
  });

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      {data?.tokens.map(token => (
        <TokenCard key={token.id} token={token} />
      ))}
      {loadNext && <button onClick={() => loadNext()}>Load More</button>}
    </div>
  );
};
```

### Direct API Endpoints

For more granular control, use the RTK Query hooks directly:

```typescript
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client";

// Find a specific token by ID
const { data: token, isLoading } = cryptoAssetsApi.useFindTokenByIdQuery({
  id: "ethereum/erc20/usdt",
});

// Find token by contract address and network
const { data: token } = cryptoAssetsApi.useFindTokenByAddressInCurrencyQuery({
  contract_address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  network: "ethereum",
});

// Get sync hash for a currency (useful for cache invalidation)
const { data: hash } = cryptoAssetsApi.useGetTokensSyncHashQuery("ethereum");
```

## API Reference

### Hooks

- `useTokensData(params)` - Fetch paginated tokens data with infinite scroll support
  - **Parameters:**
    - `networkFamily?: string` - Filter by network families (e.g., "ethereum", "polygon")
    - `pageSize?: number` - Number of items per page (default: 100, options: 10, 100, 1000)
    - `isStaging?: boolean` - Use staging environment
    - `output?: string[]` - Specify output fields (default: all fields)
  - **Returns:**
    - `data: TokensDataWithPagination` - Token data with pagination info
    - `isLoading: boolean` - Initial loading state
    - `error: any` - Error object if request failed
    - `loadNext?: () => void` - Function to load next page (undefined if no more pages)
    - `isSuccess: boolean` - Whether the request succeeded
    - `isError: boolean` - Whether the request failed
    - `refetch: () => void` - Function to refetch data

### Types

```typescript
interface TokensDataWithPagination {
  tokens: TokenCurrency[];
  pagination: {
    nextCursor?: string;
  };
}

interface GetTokensDataParams {
  networkFamily?: string[];
  isStaging?: boolean;
  pageSize?: number;
  output?: string[];
}
```

## Integration

For custom implementations, ensure you include the `cryptoAssetsApi` reducer and middleware in your Redux store configuration. The CAL client uses RTK Query for efficient data fetching and caching.

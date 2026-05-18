# CMC Client

RTK Query-based client for CoinMarketCap API endpoints.

## Overview

This client provides typed access to CoinMarketCap API endpoints using RTK Query for efficient data fetching and caching.

## Configuration

The API base URL is configured via the `CMC_API_URL` environment variable:

```typescript
CMC_API_URL: {
  def: "https://pro-api.coinmarketcap.com",
  parser: stringParser,
  desc: "CoinMarketCap API",
}
```

## Available Endpoints

### Fear and Greed Latest

Fetches the latest CMC Crypto Fear and Greed value.

**Cache/Update frequency**: Every 15 minutes
**Plan credit use**: 1 credit per request

### Altcoin Season Index Latest

Fetches the latest Altcoin Season Index with yearly high/low context.

**Cache/Update frequency**: Every 15 minutes
**Plan credit use**: 1 credit per request

## Usage

### Setup

Add the API reducer to your Redux store:

```typescript
import { cmcApi } from "@ledgerhq/live-common/cmc-client";

const store = configureStore({
  reducer: {
    [cmcApi.reducerPath]: cmcApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cmcApi.middleware),
});
```

### Using the Hooks

```typescript
import {
  useGetFearAndGreedLatestQuery,
  useGetAltcoinSeasonIndexLatestQuery,
} from "@ledgerhq/live-common/cmc-client";

function FearAndGreedIndicator() {
  const { data, isLoading, isError } = useGetFearAndGreedLatestQuery();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  return (
    <div>
      <p>Value: {data?.value}</p>
      <p>Classification: {data?.classification}</p>
    </div>
  );
}

function AltcoinSeasonIndicator() {
  const { data, isLoading, isError } = useGetAltcoinSeasonIndexLatestQuery();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  return (
    <div>
      <p>Index: {data?.value}</p>
      <p>Market Cap: {data?.altcoinMarketcap}</p>
    </div>
  );
}
```

### Polling (Auto-refresh)

To enable automatic polling every 15 minutes:

```typescript
const { data } = useGetFearAndGreedLatestQuery(undefined, {
  pollingInterval: 15 * 60 * 1000, // 15 minutes in milliseconds
});
```

### Skip Query

To conditionally skip the query:

```typescript
const { data } = useGetFearAndGreedLatestQuery(undefined, {
  skip: !isReady, // Don't fetch until ready
});
```

### Refetch on Events

RTK Query automatically refetches on:

- Window focus (if `refetchOnFocus: true`)
- Network reconnect (if `refetchOnReconnect: true`)

```typescript
const { data, refetch } = useGetFearAndGreedLatestQuery(undefined, {
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

// Manual refetch
const handleRefresh = () => refetch();
```

## Response Structures

The hooks return simplified, transformed responses:

### Fear and Greed

```typescript
{
  value: number;          // 0-100
  classification: string; // "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
}
```

### Altcoin Season Index

```typescript
{
  value: number;           // 0-100
  altcoinMarketcap: number;
}
```

### Hook States

RTK Query provides several useful states:

```typescript
const {
  data, // Transformed data: { value, classification }
  error, // Error object if request failed
  isLoading, // true on initial load
  isFetching, // true when fetching (including background refetch)
  isSuccess, // true when data is available
  isError, // true if request failed
  refetch, // Function to manually refetch
} = useGetFearAndGreedLatestQuery();
```

## API Documentation

For more details, visit: https://coinmarketcap.com/api/documentation/v1/#operation/getV3fearandgreedlatest

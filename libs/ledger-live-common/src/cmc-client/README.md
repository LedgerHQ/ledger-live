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

### Using the Hook

```typescript
import { useGetFearAndGreedLatestQuery } from "@ledgerhq/live-common/cmc-client";

function FearAndGreedIndicator() {
  const { data, error, isLoading, isFetching, isError } = useGetFearAndGreedLatestQuery();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  return (
    <div>
      <h2>Fear & Greed Index</h2>
      <p>Value: {data?.value}</p>
      <p>Classification: {data?.classification}</p>
      {isFetching && <span>Refreshing...</span>}
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

## Response Structure

The hook returns a simplified, transformed response:

```typescript
{
  value: number; // Fear & Greed index value (0-100)
  classification: string; // "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
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

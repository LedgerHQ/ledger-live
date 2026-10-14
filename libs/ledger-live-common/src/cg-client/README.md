# GC Client

RTK Query-based client for CoinGecko proxy API endpoints.

## Overview

This client provides typed access to CoinGecko proxy API endpoints using RTK Query for efficient data fetching and caching.

## Configuration

The API base URL is configured via the `COINGECKO_API_URL` environment variable:

```typescript
COINGECKO_API_URL: {
  def: "https://proxycg.api.live.ledger.com/api/v3",
  parser: stringParser,
  desc: "Coingecko api",
}
```

## Available Endpoints

### Supported Counter Currencies

Fetches the list of supported fiat/counter currencies.

**Cache duration**: 1 day

## Usage

### Setup

Add the API reducer to your Redux store:

```typescript
import { cgApi } from "@ledgerhq/live-common/cg-client/state-manager/api";

const store = configureStore({
  reducer: {
    [cgApi.reducerPath]: cgApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cgApi.middleware),
});
```

### Using the Hooks

```typescript
import {
  useMarketDataProvider,
  useSupportedCounterCurrencies,
} from "@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider";

function MarketOverview() {
  const { supportedCounterCurrencies } = useMarketDataProvider();

  return <p>Counter currencies: {supportedCounterCurrencies?.length}</p>;
}
```

### RTK Query Hooks

```typescript
import { useGetSupportedCounterCurrenciesQuery } from "@ledgerhq/live-common/cg-client/state-manager/api";

const { data: currencies } = useGetSupportedCounterCurrenciesQuery();
```

### Direct API Functions

For chart data, use the direct fetch helper (used by `useLargeMoverChartData`):

```typescript
import {
  supportedCounterCurrencies,
  fetchCurrencyChartData,
} from "@ledgerhq/live-common/cg-client/api";

const currencies = await supportedCounterCurrencies();
const chartData = await fetchCurrencyChartData({
  id: "bitcoin",
  counterCurrency: "usd",
  range: "7d",
});
```

For market coin detail charts, use `useAssetChartData` from `@ledgerhq/live-common/market/hooks/useMarketDataProvider` instead.

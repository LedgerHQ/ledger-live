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

### Supported Coins List

Fetches the list of all coins supported by the CoinGecko proxy.

**Cache duration**: 1 day

### Supported Counter Currencies

Fetches the list of supported fiat/counter currencies.

**Cache duration**: 1 day

### Currency Chart Data

Fetches historical chart data for a specific coin.

**Cache duration**: Default RTK Query behavior

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
  useCurrencyChartData,
  useSupportedCounterCurrencies,
  useSupportedCurrencies,
} from "@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider";

function MarketOverview() {
  const { supportedCounterCurrencies, supportedCurrencies } = useMarketDataProvider();

  return (
    <div>
      <p>Supported currencies: {supportedCurrencies?.length}</p>
      <p>Counter currencies: {supportedCounterCurrencies?.length}</p>
    </div>
  );
}
```

### RTK Query Hooks

```typescript
import {
  useGetSupportedCoinsListQuery,
  useGetSupportedCounterCurrenciesQuery,
  useGetCurrencyChartDataQuery,
} from "@ledgerhq/live-common/cg-client/state-manager/api";

const { data: coins } = useGetSupportedCoinsListQuery();
const { data: currencies } = useGetSupportedCounterCurrenciesQuery();
const { data: chartData } = useGetCurrencyChartDataQuery({
  id: "bitcoin",
  counterCurrency: "usd",
  range: "24h",
});
```

### Direct API Functions

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

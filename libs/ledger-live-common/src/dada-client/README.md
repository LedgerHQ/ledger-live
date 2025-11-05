# DADA Client

**DADA** stands for **Dynamic Assets Data Aggregator** - a comprehensive data management system for crypto assets, market data, and interest rates.

## Installation

The DADA client is included in `@ledgerhq/live-common`

## Usage Examples

### Mobile (React Native)

```typescript
import {
  useAssetsData,
  useInterestRatesByCurrencies,
} from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { ApyType } from "@ledgerhq/live-common/dada-client/types/trend";

// Fetch assets data
const { data, isLoading, error } = useAssetsData({
  product: "llm",
  version: "1.0.0",
  search: "bitcoin",
});

// You can control the fetching with the skip parameter
const { data, isLoading, error } = useAssetsData({
  product: "llm",
  version: "1.0.0",
  search: "bitcoin",
  skip: true, // true: no fetch
});

// Get interest rates for currencies
const currencies = [bitcoinCurrency, ethereumCurrency];
const interestRates = useInterestRatesByCurrencies(currencies);

// Use APY data
const apyData = interestRates[bitcoinCurrency.id];
if (apyData) {
  console.log(`Bitcoin APY: ${apyData.value}% (${apyData.type})`);
}
```

### Desktop (React)

```typescript
import { useAssetsData, useMarketByCurrencies } from '@ledgerhq/live-common/dada-client/hooks/useAssetsData';
import { assetsDataApi } from '@ledgerhq/live-common/dada-client/state-manager/api';

// Configure Redux store
const store = configureStore({
  reducer: {
    // ... other reducers
    [assetsDataApi.reducerPath]: assetsDataApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(assetsDataApi.middleware),
});

// Use in components
const MarketComponent = () => {
  const { data: assetsData, isLoading } = useAssetsData({
    product: 'lld',
    version: '2.0.0',
  });

  const marketData = useMarketByCurrencies(currencies);

  return (
    <div>
      {isLoading ? (
        <div>Loading market data...</div>
      ) : (
        <div>
          {Object.entries(marketData).map(([currencyId, data]) => (
            <div key={currencyId}>
              <span>{currencyId}: ${data.price}</span>
              <span>Change: {data.priceChangePercentage24h}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Lazy Currency Fetching

```typescript
import { useLazyLedgerCurrency } from '@ledgerhq/live-common/dada-client/hooks/useLazyLedgerCurrency';

const CurrencyComponent = ({ currency }) => {
  const { getLedgerCurrency } = useLazyLedgerCurrency(
    {
      product: 'lld',
      version: '2.0.0',
    },
    currency
  );

  const handleFetchCurrency = async () => {
    const ledgerCurrency = await getLedgerCurrency();
    if (ledgerCurrency) {
      console.log('Ledger currency data:', ledgerCurrency);
    }
  };

  return (
    <button onClick={handleFetchCurrency}>
      Fetch Currency Data
    </button>
  );
};
```

## API Reference

### Hooks

- `useAssetsData()` - Fetch paginated assets data
- `useAssetData()` - Fetch specific asset data
- `useInterestRatesByCurrencies()` - Get interest rates for currencies
- `useMarketByCurrencies()` - Get market data for currencies
- `useLazyLedgerCurrency()` - Lazy hook to fetch ledger currency data on demand

## Integration

For custom implementations, ensure you include the `assetsDataApi` reducer and middleware in your Redux store configuration.

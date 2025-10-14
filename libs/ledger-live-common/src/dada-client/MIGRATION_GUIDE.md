# DaDa Client Migration Guide

## Overview

Migrate from `listTokens()` and `listTokensForCryptoCurrency()` to the DaDa Client API.

> **Remove CAL Initiative ([LIVE-21487](https://ledgerhq.atlassian.net/browse/LIVE-21487))**: Replace static token lists with dynamic, server-managed asset data. Beware there are many usages of listTokens that actually are going to get dropped or moved to simpler solution than even using DaDa. This guide is for the usecases we still need to list tokens.

### useAssetsData

```typescript
const { data, isLoading, loadNext, error, refetch } = useAssetsData({
  product: "lld" | "llm", // app identifier
  version: string, // app version
  search?: string, // server-side search query
  currencyIds?: string[], // filter by parent currencies
  areCurrenciesFiltered?: boolean, // required when using currencyIds
  useCase?: string, // optimize server response
  isStaging?: boolean, // use staging API
});
```

## Integration on LLD

**Configuration:**

```typescript
product: "lld";
version: __APP_VERSION__;
```

**Pagination:** Use `react-window`'s `InfiniteLoader` + `FixedSizeList` with `loadMoreItems` callback, or implement scroll detection to call `loadNext`

## Integration on LLM

**Configuration:**

```typescript
import { VersionNumber } from "react-native-version-number";

product: "llm";
version: VersionNumber.appVersion;
```

**Pagination:** Use `BottomSheetVirtualizedList` or `FlatList` with `onEndReached={loadNext}`


## Migration Examples

### 1. Basic Token Lists

**Before:**

```typescript
import { listTokens } from "@ledgerhq/cryptoassets";

function TokenList() {
  const tokens = listTokens();
  return (
    <div>
      {tokens.map(token => <div key={token.id}>{token.name}</div>)}
    </div>
  );
}
```

**After:**

```typescript
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";

function TokenList() {
  const { data, isLoading, loadNext } = useAssetsData({
    product: "lld",
    version: __APP_VERSION__,
  });

  if (isLoading) return <div>Loading...</div>;

  const tokens = Object.values(data?.cryptoOrTokenCurrencies || {})
    .filter(currency => currency.type === "TokenCurrency");

  return (
    <SomethingThatManagesInfiniteScrollList
      data={tokens}
      renderItem={(token, index) => (
        <div key={token.id}>{token.name}</div>
      )}
      onScrollEnd={loadNext}
    />
  );
}
```

### 2. Currency-Specific Tokens

**Before:**

```typescript
import { listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";

function EthereumTokens({ currency }) {
  const tokens = listTokensForCryptoCurrency(currency);
  return (
    <select>
      {tokens.map(token => (
        <option key={token.id} value={token.id}>{token.name}</option>
      ))}
    </select>
  );
}
```

**After:**

```typescript
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";

function EthereumTokens({ currency }) {
  const { data, isLoading } = useAssetsData({
    currencyIds: [currency.id],
    areCurrenciesFiltered: true,
    product: "lld",
    version: __APP_VERSION__,
  });

  if (isLoading) return <div>Loading...</div>;

  const tokens = Object.values(data?.cryptoOrTokenCurrencies || {})
    .filter(c => c.type === "TokenCurrency" && c.parentCurrency?.id === currency.id);

  return (
    <select>
      {tokens.map(token => (
        <option key={token.id} value={token.id}>{token.name}</option>
      ))}
    </select>
  );
}
```

### 3. Search

**Before:**

```typescript
import { listTokens } from "@ledgerhq/cryptoassets";

function SearchableTokens({ searchQuery }) {
  const allTokens = listTokens();
  const filteredTokens = allTokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div>
      {filteredTokens.map(token => <div key={token.id}>{token.name}</div>)}
    </div>
  );
}
```

**After:**

```typescript
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";

function SearchableTokens({ searchQuery }) {
  const { data, isLoading, loadNext } = useAssetsData({
    search: searchQuery,
    product: "lld",
    version: __APP_VERSION__,
  });

  if (isLoading) return <div>Loading...</div>;

  const tokens = Object.values(data?.cryptoOrTokenCurrencies || {})
    .filter(currency => currency.type === "TokenCurrency");

  return (
    <SomethingThatManagesInfiniteScrollList
      data={tokens}
      renderItem={(token) => <div key={token.id}>{token.name}</div>}
      onScrollEnd={loadNext}
    />
  );
}
```

# CAL Client Migration Guide

## Overview

Migrate from `listTokens()` and `listTokensForCryptoCurrency()` to the CAL Client API.

> **Remove CAL Initiative ([LIVE-21487](https://ledgerhq.atlassian.net/browse/LIVE-21487))**: Replace static token lists with dynamic, server-managed asset data. This guide is for the usecases where we still need to list tokens dynamically.

### useTokensData

```typescript
const { data, isLoading, isSuccess, isError, loadNext, error, refetch } = useTokensData({
  networkFamily?: string, // Filter by network families (e.g., "ethereum", "polygon")
  output?: string[], // Specify output fields (e.g., ["id", "name", "ticker", "units", "delisted"])
  limit?: number, // Maximum number of assets to return
  pageSize?: number, // Number of items per page (default: 1000, options: 10, 100, 1000)
  ref?: string, // CAL reference (default: "branch:main", can be tag or commit)
  isStaging?: boolean, // Use staging or production environment
});
```

**Data Structure:**

```typescript
data: {
  tokens: TokenCurrency[], // Array of token currencies
  pagination: {
    nextCursor?: string, // Cursor for next page (if available)
  }
}
```

## Integration on LLD

**Pagination:** Use `react-window`'s `InfiniteLoader` + `FixedSizeList` with `loadMoreItems` callback, or implement scroll detection to call `loadNext`

## Integration on LLM

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
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";

function TokenList() {
  const { data, isLoading, loadNext } = useTokensData({});

  if (isLoading) return <div>Loading...</div>;

  const tokens = data?.tokens || [];

  return (
    <SomethingThatManagesInfiniteScrollList
      data={tokens}
      renderItem={(token) => (
        <div key={token.id}>{token.name}</div>
      )}
      onScrollEnd={loadNext}
    />
  );
}
```

### 2. Currency-Specific Tokens (by Network Family)

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
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";

function EthereumTokens({ networkFamily }) {
  const { data, isLoading, loadNext } = useTokensData({
    networkFamily: networkFamily, // e.g., "ethereum" or "polygon"
  });

  if (isLoading) return <div>Loading...</div>;

  const tokens = data?.tokens || [];

  return (
    <select>
      {tokens.map(token => (
        <option key={token.id} value={token.id}>{token.name}</option>
      ))}
    </select>
  );
}
```

**Note:** If you need to filter by a specific parent currency within a network family, you'll need to do client-side filtering:

```typescript
const tokens = (data?.tokens || []).filter(token => token.parentCurrency?.id === currency.id);
```

### 3. Search (Client-Side Filtering)

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
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";
import { useMemo } from "react";

function SearchableTokens({ searchQuery }) {
  const { data, isLoading, loadNext } = useTokensData({});

  const filteredTokens = useMemo(() => {
    if (!data?.tokens) return [];
    if (!searchQuery) return data.tokens;

    const query = searchQuery.toLowerCase();
    return data.tokens.filter(token =>
      token.name.toLowerCase().includes(query) ||
      token.ticker.toLowerCase().includes(query)
    );
  }, [data?.tokens, searchQuery]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <SomethingThatManagesInfiniteScrollList
      data={filteredTokens}
      renderItem={(token) => <div key={token.id}>{token.name}</div>}
      onScrollEnd={loadNext}
    />
  );
}
```

## Advanced Usage

### 4. Optimizing Performance with Specific Output Fields

If you only need certain fields from the token data, you can specify them to reduce payload size:

```typescript
import { useTokensData } from "@ledgerhq/cryptoassets/cal-client/hooks/useTokensData";

function TokenDropdown() {
  const { data, isLoading } = useTokensData({
    output: ["id", "name", "ticker"], // Only fetch what you need
    networkFamily: "ethereum",
  });

  if (isLoading) return <select disabled>Loading...</select>;

  return (
    <select>
      {data?.tokens.map(token => (
        <option key={token.id} value={token.id}>
          {token.name} ({token.ticker})
        </option>
      ))}
    </select>
  );
}
```

### 5. Using a Specific CAL Version

To ensure consistent data across deployments, you can specify a particular CAL version:

```typescript
const { data, isLoading } = useTokensData({
  ref: "tag:tokens-1.11.12", // Use a specific tag
  // ref: "branch:main", // Default: latest main branch
  // ref: "commit:48188c6ca2888a9c50a0466d2442ec2f24cc2852", // Specific commit
});
```

### 6. Limiting Total Results

For use cases where you only need a subset of tokens (e.g., displaying top tokens):

```typescript
const { data, isLoading } = useTokensData({
  limit: 50, // Only fetch first 50 tokens
  pageSize: 50, // Match page size to limit for single request
  networkFamily: "ethereum",
});
```

### 7. Using Staging Environment

For testing with staging data:

```typescript
const { data, isLoading, isError } = useTokensData({
  isStaging: true, // Use staging API
  networkFamily: "ethereum",
});
```

## Future Evolution

The CAL Client is actively evolving and will be enhanced based on real-world usage and requirements. As we gather feedback from implementations across LLD and LLM, we plan to add:

- **Server-side search capabilities** - To optimize search performance for large datasets
- **Additional filtering options** - More granular filtering based on specific use cases
- **Caching strategies** - Improved caching mechanisms for better performance
- **Additional hooks** - Specialized hooks for common patterns (e.g., `useTokensByNetwork`, `useTokenSearch`)
- **Enhanced error handling** - More detailed error types and recovery strategies

**Have a specific use case or need?** Feel free to reach out to the team or create an issue. We're committed to evolving the API based on your needs while maintaining backward compatibility where possible.

## Migration Checklist

- [ ] Replace `listTokens()` calls with `useTokensData({})`
- [ ] Replace `listTokensForCryptoCurrency()` with `useTokensData({ networkFamily: "..." })`
- [ ] Update component to handle async loading state
- [ ] Implement pagination if displaying large lists
- [ ] Update data access from flat array to `data?.tokens`
- [ ] Add client-side filtering if search functionality is needed
- [ ] Consider using `output` parameter to optimize payload size
- [ ] Test with different network families
- [ ] Verify error handling is in place

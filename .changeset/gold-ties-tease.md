---
"@ledgerhq/live-common": minor
"@ledgerhq/asset-detail": minor
---

Convert DADA market data USD prices to user's fiat currency by integrating countervalues spot rate API. Includes schema validation updates and price conversion utilities.

**Changes:**

- Update `getUsdToFiatRate` RTK Query endpoint to match flat API response format
- Add `extractUsdToFiatRate` utility for safe rate extraction from spot payload
- Add `applyUsdRateToMarket` to convert all USD-denominated market fields
- Integrate USD→fiat conversion in `useAssetMarketData` hook
- Comprehensive test coverage for schema validation and market data conversion

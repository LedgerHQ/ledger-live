---
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

fix(cg-client): remove the unused CoinGecko supported coins list query

Removes `getSupportedCoinsList`, `useGetSupportedCoinsListQuery`, `useSupportedCurrencies`, `MarketCoinSchema`, `SupportedCoinsSchema` and the `MarketCoin` / `SupportedCoins` types. `useMarketDataProvider` now only returns `supportedCounterCurrencies`.

---
"live-mobile": minor
"@ledgerhq/live-common": minor
---

Add the Portfolio Stocks data layer. `useDefaultStocksAssets` fetches the top stocks (market-cap ordered) from the DADA stocks category via `useStocksData` + `selectTopStocks` for the discovery scenario (no-op when disabled). `useCategorizedAssetsFromPortfolio` now returns a `stocks` bucket split out of `cryptos`, identified by DADA currency id via the new `useStockAssetIds` hook — matching by id rather than ticker avoids symbol collisions (e.g. a crypto like TON is no longer misclassified as a stock).

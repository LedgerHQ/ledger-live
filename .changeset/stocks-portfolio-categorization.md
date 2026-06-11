---
"live-mobile": minor
"@ledgerhq/live-common": minor
---

Categorize held stocks in the portfolio: `useCategorizedAssetsFromPortfolio` now returns a `stocks` bucket (split out of `cryptos`) identified by DADA currency id via the new `useStockAssetIds` hook. Matching by id (rather than ticker) avoids symbol collisions — e.g. a crypto like TON is no longer misclassified as a stock. Adds the `MAX_STOCKS_TO_DISPLAY` / `EMPTY_STATE_MAX_STOCKS` constants.

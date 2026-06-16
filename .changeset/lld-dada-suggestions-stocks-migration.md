---
"ledger-live-desktop": patch
---

Migrate the search-overlay asset suggestions to the DADA assets endpoint (`useAssetsData` + `useUsdToFiatRate`) instead of `useMarketData`, exposing an `isError` state for cryptos/stablecoins and stocks. The Stocks section also moves from a CSS grid to an explicit two-row layout (shared `splitIntoTwoRows` helper) to keep the column-major scroll order.

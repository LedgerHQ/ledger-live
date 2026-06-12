---
"ledger-live-desktop": minor
---

Add the Portfolio Stocks section behind the `assetDiscoverability` flag. `useCategorizedAssetsFromPortfolio` now returns a `stocks` bucket split out of `cryptos` by DADA currency id (collision-free vs ticker, so a crypto like TON isn't misclassified). When the user holds stocks the section renders a table like Cryptos/Stablecoins (max 5, "Explore all" → the `/assets?category=stocks` filtered view); otherwise it renders the discovery grid of the top default stocks ("Explore" → Market filtered to stocks). Renames the discovery `StockRow` pill to `StockPill`.

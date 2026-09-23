---
"@domain/entity-market-index-fear-and-greed": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

refactor(market): rename the Fear & Greed entity package to the `market-index-*` namespace

`@domain/entity-market-sentiment` becomes `@domain/entity-market-index-fear-and-greed`, and
`domain/entity/market-sentiment` becomes `domain/entity/market-index-fear-and-greed`. The old
name used a namespace as a leaf: it holds one specific CoinMarketCap index, not market sentiment
in general, which left the sibling Altcoin Season index with nowhere to sit.

Pure rename. No behaviour change, and no symbol changes inside the package: `FearAndGreedIndexSchema`
and `FearAndGreedIndex` already carried the index's real name.

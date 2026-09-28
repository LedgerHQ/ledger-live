---
"@domain/api-market-index-altcoin-season": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

refactor(domain): rename `@domain/api-altcoins-sentiment` to `@domain/api-market-index-altcoin-season`

The package wraps one specific CoinMarketCap product, the Altcoin Season Index, so the old name
used `sentiment` as a top-level leaf for something that measures capital rotation rather than
sentiment. The new name places it in the `market-index-*` namespace alongside its Fear and Greed
sibling and uses the provider's own product name for the leaf.

The exported api follows the package leaf: `altcoinsSentimentApi` becomes `altcoinSeasonApi` and
the `AltcoinsSentimentApi` type becomes `AltcoinSeasonApi`. `ALTCOIN_SEASON_INDEX_TAGS`,
`transformAltcoinSeasonIndexResponse` and `useGetAltcoinSeasonIndexLatestQuery` are unchanged.
The README, which documented an implementation the package never had, is rewritten against the
code. No behaviour change.

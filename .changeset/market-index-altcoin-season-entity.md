---
"@domain/entity-market-index-altcoin-season": minor
"live-mobile": minor
---

refactor(domain): rename the altcoins-sentiment entity to market-index-altcoin-season

`@domain/entity-altcoins-sentiment` becomes `@domain/entity-market-index-altcoin-season`. The
package holds the CoinMarketCap Altcoin Season Index, so the new name puts it in a
`market-index-*` namespace alongside the other CoinMarketCap index rather than using
`sentiment` as a second top-level name for the same kind of thing.

Pure rename: the exported `AltcoinSeasonIndexSchema` and `AltcoinSeasonIndex` are unchanged,
and every call site now imports from the new specifier.

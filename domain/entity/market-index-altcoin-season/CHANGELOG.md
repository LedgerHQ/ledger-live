# @domain/entity-altcoins-sentiment

## 0.3.0-next.0

### Minor Changes

- [#22369](https://github.com/LedgerHQ/ledger-live/pull/22369) [`8475c70`](https://github.com/LedgerHQ/ledger-live/commit/8475c704ed5cc75bcfddc9789130281ad0c2aca5) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(domain): rename the altcoins-sentiment entity to market-index-altcoin-season

  `@domain/entity-altcoins-sentiment` becomes `@domain/entity-market-index-altcoin-season`. The
  package holds the CoinMarketCap Altcoin Season Index, so the new name puts it in a
  `market-index-*` namespace alongside the other CoinMarketCap index rather than using
  `sentiment` as a second top-level name for the same kind of thing.

  Pure rename: the exported `AltcoinSeasonIndexSchema` and `AltcoinSeasonIndex` are unchanged,
  and every call site now imports from the new specifier.

## 0.2.0

### Minor Changes

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

## 0.2.0-next.0

### Minor Changes

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

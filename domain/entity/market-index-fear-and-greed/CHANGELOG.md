# @domain/entity-market-sentiment

## 0.3.0

### Minor Changes

- [#22376](https://github.com/LedgerHQ/ledger-live/pull/22376) [`cdcb834`](https://github.com/LedgerHQ/ledger-live/commit/cdcb83446d2a70c910fee7cded0b03f3ab325b30) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(market): rename the Fear & Greed entity package to the `market-index-*` namespace

  `@domain/entity-market-sentiment` becomes `@domain/entity-market-index-fear-and-greed`, and
  `domain/entity/market-sentiment` becomes `domain/entity/market-index-fear-and-greed`. The old
  name used a namespace as a leaf: it holds one specific CoinMarketCap index, not market sentiment
  in general, which left the sibling Altcoin Season index with nowhere to sit.

  Pure rename. No behaviour change, and no symbol changes inside the package: `FearAndGreedIndexSchema`
  and `FearAndGreedIndex` already carried the index's real name.

## 0.3.0-next.0

### Minor Changes

- [#22376](https://github.com/LedgerHQ/ledger-live/pull/22376) [`cdcb834`](https://github.com/LedgerHQ/ledger-live/commit/cdcb83446d2a70c910fee7cded0b03f3ab325b30) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(market): rename the Fear & Greed entity package to the `market-index-*` namespace

  `@domain/entity-market-sentiment` becomes `@domain/entity-market-index-fear-and-greed`, and
  `domain/entity/market-sentiment` becomes `domain/entity/market-index-fear-and-greed`. The old
  name used a namespace as a leaf: it holds one specific CoinMarketCap index, not market sentiment
  in general, which left the sibling Altcoin Season index with nowhere to sit.

  Pure rename. No behaviour change, and no symbol changes inside the package: `FearAndGreedIndexSchema`
  and `FearAndGreedIndex` already carried the index's real name.

## 0.2.0

### Minor Changes

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

## 0.2.0-next.0

### Minor Changes

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

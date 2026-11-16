# @domain/api-altcoins-sentiment

## 0.5.0

### Minor Changes

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @shared/api-services@0.13.0

## 0.5.0-next.0

### Minor Changes

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @shared/api-services@0.13.0-next.0

## 0.4.4

### Patch Changes

- Updated dependencies [[`0c62d35`](https://github.com/LedgerHQ/ledger-live/commit/0c62d3533f72e450c2235f8d23aa1cdb101486a9)]:
  - @shared/api-services@0.12.0

## 0.4.4-next.0

### Patch Changes

- Updated dependencies [[`0c62d35`](https://github.com/LedgerHQ/ledger-live/commit/0c62d3533f72e450c2235f8d23aa1cdb101486a9)]:
  - @shared/api-services@0.12.0-next.0

## 0.4.3

### Patch Changes

- Updated dependencies [[`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2)]:
  - @shared/api-services@0.11.0

## 0.4.3-next.0

### Patch Changes

- Updated dependencies [[`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`0953772`](https://github.com/LedgerHQ/ledger-live/commit/0953772eafec52773cf7a19c08295c72a2e296a2)]:
  - @shared/api-services@0.11.0-next.0

## 0.4.2

### Patch Changes

- Updated dependencies []:
  - @shared/api-services@0.10.1

## 0.4.2-next.0

### Patch Changes

- Updated dependencies []:
  - @shared/api-services@0.10.1-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c)]:
  - @shared/api-services@0.10.0
  - @domain/entity-market-index-altcoin-season@0.3.0

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c)]:
  - @shared/api-services@0.10.0-next.0
  - @domain/entity-market-index-altcoin-season@0.3.0

## 0.4.0

### Minor Changes

- [#22378](https://github.com/LedgerHQ/ledger-live/pull/22378) [`87de096`](https://github.com/LedgerHQ/ledger-live/commit/87de096183309fa2152abe838f09a537b681e8eb) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(domain): rename `@domain/api-altcoins-sentiment` to `@domain/api-market-index-altcoin-season`

  The package wraps one specific CoinMarketCap product, the Altcoin Season Index, so the old name
  used `sentiment` as a top-level leaf for something that measures capital rotation rather than
  sentiment. The new name places it in the `market-index-*` namespace alongside its Fear and Greed
  sibling and uses the provider's own product name for the leaf.

  The exported api follows the package leaf: `altcoinsSentimentApi` becomes `altcoinSeasonApi` and
  the `AltcoinsSentimentApi` type becomes `AltcoinSeasonApi`. `ALTCOIN_SEASON_INDEX_TAGS`,
  `transformAltcoinSeasonIndexResponse` and `useGetAltcoinSeasonIndexLatestQuery` are unchanged.
  The README, which documented an implementation the package never had, is rewritten against the
  code. No behaviour change.

### Patch Changes

- Updated dependencies [[`8475c70`](https://github.com/LedgerHQ/ledger-live/commit/8475c704ed5cc75bcfddc9789130281ad0c2aca5), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43)]:
  - @domain/entity-market-index-altcoin-season@0.3.0
  - @shared/api-services@0.9.0

## 0.4.0-next.0

### Minor Changes

- [#22378](https://github.com/LedgerHQ/ledger-live/pull/22378) [`87de096`](https://github.com/LedgerHQ/ledger-live/commit/87de096183309fa2152abe838f09a537b681e8eb) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(domain): rename `@domain/api-altcoins-sentiment` to `@domain/api-market-index-altcoin-season`

  The package wraps one specific CoinMarketCap product, the Altcoin Season Index, so the old name
  used `sentiment` as a top-level leaf for something that measures capital rotation rather than
  sentiment. The new name places it in the `market-index-*` namespace alongside its Fear and Greed
  sibling and uses the provider's own product name for the leaf.

  The exported api follows the package leaf: `altcoinsSentimentApi` becomes `altcoinSeasonApi` and
  the `AltcoinsSentimentApi` type becomes `AltcoinSeasonApi`. `ALTCOIN_SEASON_INDEX_TAGS`,
  `transformAltcoinSeasonIndexResponse` and `useGetAltcoinSeasonIndexLatestQuery` are unchanged.
  The README, which documented an implementation the package never had, is rewritten against the
  code. No behaviour change.

### Patch Changes

- Updated dependencies [[`8475c70`](https://github.com/LedgerHQ/ledger-live/commit/8475c704ed5cc75bcfddc9789130281ad0c2aca5), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43)]:
  - @domain/entity-market-index-altcoin-season@0.3.0-next.0
  - @shared/api-services@0.9.0-next.0

## 0.3.6

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce)]:
  - @shared/api-services@0.8.0

## 0.3.6-next.0

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce)]:
  - @shared/api-services@0.8.0-next.0

## 0.3.5

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @shared/api-services@0.7.0

## 0.3.5-next.0

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @shared/api-services@0.7.0-next.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8)]:
  - @shared/api-services@0.6.0

## 0.3.4-next.0

### Patch Changes

- Updated dependencies [[`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8)]:
  - @shared/api-services@0.6.0-next.0

## 0.3.3

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0

## 0.3.3-next.0

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0-next.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc)]:
  - @shared/api-services@0.4.0

## 0.3.2-next.0

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc)]:
  - @shared/api-services@0.4.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

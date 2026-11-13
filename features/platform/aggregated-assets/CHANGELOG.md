# @features/platform-aggregated-assets

## 0.7.0

### Minor Changes

- [#24189](https://github.com/LedgerHQ/ledger-live/pull/24189) [`711b543`](https://github.com/LedgerHQ/ledger-live/commit/711b543456a56c18f5aa0828de974a2ee9b94c6b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Let users pick the network when they swap a multi-network asset from Market or Asset Detail, also when they have no account for it. Show only the networks of the asset itself, so USDC no longer opens an extra asset step. When the drawer keeps only one network, open the account step on that network.

- [#24520](https://github.com/LedgerHQ/ledger-live/pull/24520) [`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand `AggregatedAssetId` and `MarketId`, and replace both copies of `dadaIdToMarketId` with the typed `toMarketId` and `parseMarketRef` bridge in `@domain/api-aggregated-assets`

- [#24472](https://github.com/LedgerHQ/ledger-live/pull/24472) [`55a43bc`](https://github.com/LedgerHQ/ledger-live/commit/55a43bcb1d736466d956eb8645d9e310e3daaaab) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Show the 1D market variation for an unchanged account balance

- [#24594](https://github.com/LedgerHQ/ledger-live/pull/24594) [`b67184a`](https://github.com/LedgerHQ/ledger-live/commit/b67184adc0aa9a2e0871a8a636fa8bdcee846877) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align desktop 1D asset and account variation with the market banner

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-aggregated-asset@0.4.0
  - @domain/api-aggregated-assets@0.7.0
  - @domain/entity-currency@0.5.0
  - @features/platform-env@0.4.5

## 0.7.0-next.0

### Minor Changes

- [#24189](https://github.com/LedgerHQ/ledger-live/pull/24189) [`711b543`](https://github.com/LedgerHQ/ledger-live/commit/711b543456a56c18f5aa0828de974a2ee9b94c6b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Let users pick the network when they swap a multi-network asset from Market or Asset Detail, also when they have no account for it. Show only the networks of the asset itself, so USDC no longer opens an extra asset step. When the drawer keeps only one network, open the account step on that network.

- [#24520](https://github.com/LedgerHQ/ledger-live/pull/24520) [`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand `AggregatedAssetId` and `MarketId`, and replace both copies of `dadaIdToMarketId` with the typed `toMarketId` and `parseMarketRef` bridge in `@domain/api-aggregated-assets`

- [#24472](https://github.com/LedgerHQ/ledger-live/pull/24472) [`55a43bc`](https://github.com/LedgerHQ/ledger-live/commit/55a43bcb1d736466d956eb8645d9e310e3daaaab) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Show the 1D market variation for an unchanged account balance

- [#24594](https://github.com/LedgerHQ/ledger-live/pull/24594) [`b67184a`](https://github.com/LedgerHQ/ledger-live/commit/b67184adc0aa9a2e0871a8a636fa8bdcee846877) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align desktop 1D asset and account variation with the market banner

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`f781149`](https://github.com/LedgerHQ/ledger-live/commit/f7811490b8965dabe3be45c36b9ffb5e29bd1ead), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-aggregated-asset@0.4.0-next.0
  - @domain/api-aggregated-assets@0.7.0-next.0
  - @domain/entity-currency@0.5.0-next.0
  - @features/platform-env@0.4.5-next.0

## 0.6.0

### Minor Changes

- [#23978](https://github.com/LedgerHQ/ledger-live/pull/23978) [`604337a`](https://github.com/LedgerHQ/ledger-live/commit/604337ae838d77457b41bf42ad075a3016edf80d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the account buy sheet when only one asset can be bought

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.6.3
  - @domain/entity-currency@0.4.9
  - @features/platform-env@0.4.4

## 0.6.0-next.0

### Minor Changes

- [#23978](https://github.com/LedgerHQ/ledger-live/pull/23978) [`604337a`](https://github.com/LedgerHQ/ledger-live/commit/604337ae838d77457b41bf42ad075a3016edf80d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the account buy sheet when only one asset can be bought

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.6.3-next.0
  - @domain/entity-currency@0.4.9-next.0
  - @features/platform-env@0.4.4-next.0

## 0.5.8

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.8
  - @domain/api-aggregated-assets@0.6.2

## 0.5.8-next.0

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency@0.4.8-next.0
  - @domain/api-aggregated-assets@0.6.2-next.0

## 0.5.7

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.6.1
  - @domain/entity-currency@0.4.7
  - @features/platform-env@0.4.3

## 0.5.7-next.0

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.6.1-next.0
  - @domain/entity-currency@0.4.7-next.0
  - @features/platform-env@0.4.3-next.0

## 0.5.6

### Patch Changes

- Updated dependencies [[`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99)]:
  - @domain/api-aggregated-assets@0.6.0
  - @domain/entity-currency@0.4.6
  - @features/platform-env@0.4.2
  - @domain/entity-aggregated-asset@0.3.0
  - @domain/entity-interest-rate@0.3.0

## 0.5.6-next.0

### Patch Changes

- Updated dependencies [[`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99)]:
  - @domain/api-aggregated-assets@0.6.0-next.0
  - @domain/entity-currency@0.4.6-next.0
  - @features/platform-env@0.4.2-next.0
  - @domain/entity-aggregated-asset@0.3.0
  - @domain/entity-interest-rate@0.3.0

## 0.5.5

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.5.3
  - @features/platform-env@0.4.1
  - @domain/entity-currency@0.4.5

## 0.5.5-next.0

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.5.3-next.0
  - @features/platform-env@0.4.1-next.0
  - @domain/entity-currency@0.4.5-next.0

## 0.5.4

### Patch Changes

- Updated dependencies [[`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b)]:
  - @features/platform-env@0.4.0
  - @domain/api-aggregated-assets@0.5.2
  - @domain/entity-currency@0.4.4

## 0.5.4-next.0

### Patch Changes

- Updated dependencies [[`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b)]:
  - @features/platform-env@0.4.0-next.0
  - @domain/api-aggregated-assets@0.5.2-next.0
  - @domain/entity-currency@0.4.4-next.0

## 0.5.3

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.5.1
  - @features/platform-env@0.3.1

## 0.5.3-next.0

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.5.1-next.0
  - @features/platform-env@0.3.1-next.0

## 0.5.2

### Patch Changes

- Updated dependencies [[`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317)]:
  - @domain/api-aggregated-assets@0.5.0
  - @features/platform-env@0.3.0
  - @domain/entity-currency@0.4.3

## 0.5.2-next.0

### Patch Changes

- Updated dependencies [[`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317)]:
  - @domain/api-aggregated-assets@0.5.0-next.0
  - @features/platform-env@0.3.0-next.0
  - @domain/entity-currency@0.4.3-next.0

## 0.5.1

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.4.2
  - @features/platform-env@0.2.3
  - @domain/entity-currency@0.4.2

## 0.5.1-next.0

### Patch Changes

- Updated dependencies []:
  - @domain/api-aggregated-assets@0.4.2-next.0
  - @features/platform-env@0.2.3-next.0
  - @domain/entity-currency@0.4.2-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

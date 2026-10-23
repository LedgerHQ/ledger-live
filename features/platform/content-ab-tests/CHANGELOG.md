# @features/platform-content-ab-tests

## 0.2.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-feature-flags-firebase@0.1.1

## 0.2.1-next.0

### Patch Changes

- Updated dependencies []:
  - @features/platform-feature-flags-firebase@0.1.1-next.0

## 0.2.0

### Minor Changes

- [#22604](https://github.com/LedgerHQ/ledger-live/pull/22604) [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add an `ab_tests` attribute to desktop and mobile analytics events with the `trackingConfiguration` of each enabled English copy experiment, or `{}` when none applies

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22635](https://github.com/LedgerHQ/ledger-live/pull/22635) [`aaedf56`](https://github.com/LedgerHQ/ledger-live/commit/aaedf5692e9c1407327d009fea8133e51ca48f26) Thanks [@sarneijim](https://github.com/sarneijim)! - Read enabled feature*copy*\* experiments from the existing Remote Config payload and apply them as English copy overrides

### Patch Changes

- Updated dependencies [[`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4)]:
  - @features/platform-feature-flags-firebase@0.1.0

## 0.2.0-next.0

### Minor Changes

- [#22604](https://github.com/LedgerHQ/ledger-live/pull/22604) [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add an `ab_tests` attribute to desktop and mobile analytics events with the `trackingConfiguration` of each enabled English copy experiment, or `{}` when none applies

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22635](https://github.com/LedgerHQ/ledger-live/pull/22635) [`aaedf56`](https://github.com/LedgerHQ/ledger-live/commit/aaedf5692e9c1407327d009fea8133e51ca48f26) Thanks [@sarneijim](https://github.com/sarneijim)! - Read enabled feature*copy*\* experiments from the existing Remote Config payload and apply them as English copy overrides

### Patch Changes

- Updated dependencies [[`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4)]:
  - @features/platform-feature-flags-firebase@0.1.0-next.0

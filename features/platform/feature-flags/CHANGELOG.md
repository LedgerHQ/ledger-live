# @features/platform-feature-flags

## 0.10.0-next.0

### Minor Changes

- [#23596](https://github.com/LedgerHQ/ledger-live/pull/23596) [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop My Wallet and drop the lwdWallet40 myWallet param

- [#23588](https://github.com/LedgerHQ/ledger-live/pull/23588) [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show Wallet 4.0 PnL and drop the `pnl` feature flag param

### Patch Changes

- Updated dependencies [[`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @shared/feature-flags@0.28.0-next.0

## 0.9.1

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0

## 0.9.1-next.0

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0-next.0

## 0.9.0

### Minor Changes

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

### Patch Changes

- Updated dependencies [[`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e)]:
  - @shared/feature-flags@0.26.0

## 0.9.0-next.0

### Minor Changes

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

### Patch Changes

- Updated dependencies [[`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e)]:
  - @shared/feature-flags@0.26.0-next.0

## 0.8.1

### Patch Changes

- Updated dependencies [[`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed)]:
  - @shared/feature-flags@0.25.0

## 0.8.1-next.1

### Patch Changes

- Updated dependencies [[`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21)]:
  - @shared/feature-flags@0.25.0-next.1

## 0.8.1-next.0

### Patch Changes

- Updated dependencies [[`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed)]:
  - @shared/feature-flags@0.25.0-next.0

## 0.8.0

### Minor Changes

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

### Patch Changes

- Updated dependencies [[`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629)]:
  - @shared/feature-flags@0.24.0

## 0.8.0-next.0

### Minor Changes

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

### Patch Changes

- Updated dependencies [[`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629)]:
  - @shared/feature-flags@0.24.0-next.0

## 0.7.0

### Minor Changes

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): share the Firebase Remote Config parser between apps

  Both apps carried their own copy of the Firebase-key-to-FeatureId map and the loop that filters
  and JSON-parses a `getAll()` payload. `parseFirebaseFeatures` now lives in
  `@features/platform-feature-flags/firebase`, next to `formatToFirebaseFeatureId`, of which its
  key map is the exact inverse.

  It takes a structural `RemoteConfigValue` (`getSource()` + `asString()`), satisfied by both the
  Firebase JS SDK and `@react-native-firebase`, so the package gains no SDK dependency. Reading the
  SDK stays per-app, where the two platforms are deliberately asymmetric.

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

### Patch Changes

- Updated dependencies [[`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2)]:
  - @shared/feature-flags@0.23.0

## 0.7.0-next.0

### Minor Changes

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): share the Firebase Remote Config parser between apps

  Both apps carried their own copy of the Firebase-key-to-FeatureId map and the loop that filters
  and JSON-parses a `getAll()` payload. `parseFirebaseFeatures` now lives in
  `@features/platform-feature-flags/firebase`, next to `formatToFirebaseFeatureId`, of which its
  key map is the exact inverse.

  It takes a structural `RemoteConfigValue` (`getSource()` + `asString()`), satisfied by both the
  Firebase JS SDK and `@react-native-firebase`, so the package gains no SDK dependency. Reading the
  SDK stays per-app, where the two platforms are deliberately asymmetric.

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

### Patch Changes

- Updated dependencies [[`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2)]:
  - @shared/feature-flags@0.23.0-next.0

## 0.6.9

### Patch Changes

- Updated dependencies [[`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d)]:
  - @shared/feature-flags@0.22.0

## 0.6.9-next.1

### Patch Changes

- Updated dependencies [[`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914)]:
  - @shared/feature-flags@0.22.0-next.1

## 0.6.9-next.0

### Patch Changes

- Updated dependencies [[`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d)]:
  - @shared/feature-flags@0.22.0-next.0

## 0.6.8

### Patch Changes

- Updated dependencies [[`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e)]:
  - @shared/feature-flags@0.21.0

## 0.6.8-next.0

### Patch Changes

- Updated dependencies [[`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e)]:
  - @shared/feature-flags@0.21.0-next.0

## 0.6.7

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @shared/feature-flags@0.20.0

## 0.6.7-next.0

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @shared/feature-flags@0.20.0-next.0

## 0.6.6

### Patch Changes

- Updated dependencies [[`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c)]:
  - @shared/feature-flags@0.19.0

## 0.6.6-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @shared/feature-flags@0.19.0-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

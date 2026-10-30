# @features/flow-portfolio-services-entry-points

## 0.1.0-next.0

### Minor Changes

- [#23816](https://github.com/LedgerHQ/ledger-live/pull/23816) [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feat(portfolio): A/B test services entry points cards between Crypto and Stablecoins

  `entryPointsServices` replaces the Perps and Borrow banners with a Services cards section on the LWD and LWM portfolio asset section. `params.services` sets which services show and their order. Flag state and order are reported to Mixpanel as `entryPointsServices`.

### Patch Changes

- Updated dependencies [[`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @shared/feature-flags@0.28.0-next.0
  - @features/platform-feature-flags@0.10.0-next.0
  - @shared/analytics@0.4.0
  - @shared/i18n@0.2.0

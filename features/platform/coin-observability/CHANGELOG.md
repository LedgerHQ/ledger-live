# @features/platform-coin-observability

## 0.3.0

### Minor Changes

- [#24865](https://github.com/LedgerHQ/ledger-live/pull/24865) [`c47814c`](https://github.com/LedgerHQ/ledger-live/commit/c47814c94967febb435d0dcb77cc2f8de7f2c3f7) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Make the `coin_module_call` tiers remotely configurable: a new `methodTiers` param of the `coinObservability` flag moves a coin-module method to the `transaction`, `preparation`, `sync` or `off` tier without a release. `craftTransactionData` moves to the `preparation` tier, since the bridge calls it on every edit of a transaction, and each `coin_module_call` now carries its `tier`. `shouldTransmitCoinModuleCall` is removed: `createCoinModuleCallTransmitter` holds the whole policy.

- [#25054](https://github.com/LedgerHQ/ledger-live/pull/25054) [`9924d57`](https://github.com/LedgerHQ/ledger-live/commit/9924d57433212aaaf4491573b5777236e01c3559) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Make `DEFAULT_METHOD_TIERS` a whitelist of the observed coin-module methods: a method it does not list is `off` unless the `coinObservability` flag gives it a tier, and live-common no longer checks at compile time that it names every method of the contract, so a coin-module-framework release that adds a method no longer breaks the build.

## 0.3.0-next.0

### Minor Changes

- [#24865](https://github.com/LedgerHQ/ledger-live/pull/24865) [`c47814c`](https://github.com/LedgerHQ/ledger-live/commit/c47814c94967febb435d0dcb77cc2f8de7f2c3f7) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Make the `coin_module_call` tiers remotely configurable: a new `methodTiers` param of the `coinObservability` flag moves a coin-module method to the `transaction`, `preparation`, `sync` or `off` tier without a release. `craftTransactionData` moves to the `preparation` tier, since the bridge calls it on every edit of a transaction, and each `coin_module_call` now carries its `tier`. `shouldTransmitCoinModuleCall` is removed: `createCoinModuleCallTransmitter` holds the whole policy.

- [#25054](https://github.com/LedgerHQ/ledger-live/pull/25054) [`9924d57`](https://github.com/LedgerHQ/ledger-live/commit/9924d57433212aaaf4491573b5777236e01c3559) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Make `DEFAULT_METHOD_TIERS` a whitelist of the observed coin-module methods: a method it does not list is `off` unless the `coinObservability` flag gives it a tier, and live-common no longer checks at compile time that it names every method of the contract, so a coin-module-framework release that adds a method no longer breaks the build.

## 0.2.0

### Minor Changes

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Move the coin-module call event, its observer registry and the transmission policy out of live-common into `@features/platform-coin-observability`; live-common keeps only the `withMetrics` resolver adapter.

## 0.2.0-next.0

### Minor Changes

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Move the coin-module call event, its observer registry and the transmission policy out of live-common into `@features/platform-coin-observability`; live-common keeps only the `withMetrics` resolver adapter.

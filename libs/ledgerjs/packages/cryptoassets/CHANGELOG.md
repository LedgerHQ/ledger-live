# @ledgerhq/cryptoassets

## 6.34.0

### Minor Changes

- [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

* [#995](https://github.com/LedgerHQ/ledger-live/pull/995) [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220830

- [#995](https://github.com/LedgerHQ/ledger-live/pull/995) [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220819

* [#810](https://github.com/LedgerHQ/ledger-live/pull/810) [`5dd957b3c`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0) Thanks [@balthazar](https://github.com/balthazar)! - Update ZIL&TT explorer and color

### Patch Changes

- [#1023](https://github.com/LedgerHQ/ledger-live/pull/1023) [`318e80452`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd) Thanks [@gre](https://github.com/gre)! - Fixes testnet currencies to be \$0 valued on countervalues

## 6.34.0-next.1

### Minor Changes

- [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

## 6.34.0-next.0

### Minor Changes

- [#995](https://github.com/LedgerHQ/ledger-live/pull/995) [`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220830

* [#995](https://github.com/LedgerHQ/ledger-live/pull/995) [`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220819

- [#810](https://github.com/LedgerHQ/ledger-live/pull/810) [`5dd957b3cb`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0) Thanks [@balthazar](https://github.com/balthazar)! - Update ZIL&TT explorer and color

### Patch Changes

- [#1023](https://github.com/LedgerHQ/ledger-live/pull/1023) [`318e804525`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd) Thanks [@gre](https://github.com/gre)! - Fixes testnet currencies to be \$0 valued on countervalues

## 6.32.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#887](https://github.com/LedgerHQ/ledger-live/pull/887) [`e2a9cfad63`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220809

## 6.33.0

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

## 6.33.0-next.0

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

## 6.32.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

- [#887](https://github.com/LedgerHQ/ledger-live/pull/887) [`e2a9cfad63`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220809

## 6.32.0-next.1

### Minor Changes

- [#723](https://github.com/LedgerHQ/ledger-live/pull/723) [`0c12f3e89`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1) Thanks [@marco-figment](https://github.com/marco-figment)! - Osmosis Send, Receive and Staking + Cosmos refactor

  For additional context on what changed:

  - Ledger Live Desktop: functionality for Osmosis send, receive and staking.
  - Ledger Live Desktop: refactor of some Cosmos components to enable reusing some components for Osmosis.
    and easily integrate future Cosmos-based cryptocurrencies.

  - Ledger Live Common: functionality for Osmosis send, receive and staking.
  - Ledger Live Common: refactor of some Cosmos modules to enable reusing code for Osmosis.
    Notable changes are: renaming the hook useCosmosPreloadData to useCosmosFamilyPreloadData and turning
    validators.ts and js-synchronisation.ts into classes.

  - Ledger Live Mobile: only marked as major because the useCosmosPreloadData hook changed name, which is a breaking change.

  - Cryptoassets: updated a URL in the Osmosis cryptocurrency definition.

  - Live CLI: updated references to cosmosSourceValidators to sourceValidators for re-usability.

## 6.32.0-next.0

### Minor Changes

- [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

* [#887](https://github.com/LedgerHQ/ledger-live/pull/887) [`e2a9cfad6`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220809

## 6.31.0

### Minor Changes

- [#702](https://github.com/LedgerHQ/ledger-live/pull/702) [`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220721

## 6.31.0-next.0

### Minor Changes

- [#702](https://github.com/LedgerHQ/ledger-live/pull/702) [`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - CAL update 20220721

## 6.30.0

### Minor Changes

- [#604](https://github.com/LedgerHQ/ledger-live/pull/604) [`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b) Thanks [@gre](https://github.com/gre)! - Set Goerli currency on coinType=60 per eth accepted convention

* [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

## 6.30.0-next.2

### Minor Changes

- [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

## 6.30.0-next.1

### Minor Changes

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

## 6.30.0-next.0

### Minor Changes

- [#604](https://github.com/LedgerHQ/ledger-live/pull/604) [`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b) Thanks [@gre](https://github.com/gre)! - Set Goerli currency on coinType=60 per eth accepted convention

## 6.29.0

### Minor Changes

- [#479](https://github.com/LedgerHQ/ledger-live/pull/479) [`6e956f22b`](https://github.com/LedgerHQ/ledger-live/commit/6e956f22bdf96f7a902b48a8cd231a34053d459b) Thanks [@adrienlacombe-ledger](https://github.com/adrienlacombe-ledger)! - Update CAL

## 6.29.0-next.0

### Minor Changes

- 6e956f22b: Update CAL

# @ledgerhq/live-common

## 27.1.0

### Minor Changes

- [#744](https://github.com/LedgerHQ/ledger-live/pull/744) [`0ebdec50b`](https://github.com/LedgerHQ/ledger-live/commit/0ebdec50bfca81b2d814726f8f9a82237ad42ffc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add an EVM based family in LLC

* [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

- [#1155](https://github.com/LedgerHQ/ledger-live/pull/1155) [`3849ee3f3`](https://github.com/LedgerHQ/ledger-live/commit/3849ee3f30987b51d648ce29bfee4721f4ddff5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add requirement to cosmos banner

* [#954](https://github.com/LedgerHQ/ledger-live/pull/954) [`336eb879a`](https://github.com/LedgerHQ/ledger-live/commit/336eb879a80573fd81027232c4c6c9b383bd2a97) Thanks [@andyhass](https://github.com/andyhass)! - The Ledger QA team discovered that an error could occur when calculating the max spendable and max non-voting locked balance when pending operations existed. These balances are set when the account syncs, and these balances will not take into account pending operations - leaving it to be higher than it truly is. This results in a runtime error related to trying to create a transaction that is larger than the respective balance.

- [#1059](https://github.com/LedgerHQ/ledger-live/pull/1059) [`685348dd3`](https://github.com/LedgerHQ/ledger-live/commit/685348dd351181a9ed7f23cedb3e3d289b16fe9e) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix glitch on tx value when sending tokens

* [#963](https://github.com/LedgerHQ/ledger-live/pull/963) [`dd538c372`](https://github.com/LedgerHQ/ledger-live/commit/dd538c3723853334ce19a89353f20766432d12fd) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - replace cbor lib to get rid of BigInt type

- [#1072](https://github.com/LedgerHQ/ledger-live/pull/1072) [`0601b6541`](https://github.com/LedgerHQ/ledger-live/commit/0601b6541f10635aea72f916626432a334aa49fa) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - display fees on historical transactions properly

* [#856](https://github.com/LedgerHQ/ledger-live/pull/856) [`3615a06f1`](https://github.com/LedgerHQ/ledger-live/commit/3615a06f19ef659480d50a1a1a28f6df952b117a) Thanks [@andyhass](https://github.com/andyhass)! - Gracefully handle when user reaches the maximum number of Celo validator groups they can vote for.

- [#1017](https://github.com/LedgerHQ/ledger-live/pull/1017) [`21ed0bd52`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300) Thanks [@sarneijim](https://github.com/sarneijim)! - Add cosmos account banner util

### Patch Changes

- [#1025](https://github.com/LedgerHQ/ledger-live/pull/1025) [`7e812a738`](https://github.com/LedgerHQ/ledger-live/commit/7e812a738db718200138dcb9b7bcc2f6dd0ddd6f) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: hooks for genuine check and get latest available firmware

* [#1092](https://github.com/LedgerHQ/ledger-live/pull/1092) [`058a1af7f`](https://github.com/LedgerHQ/ledger-live/commit/058a1af7ff463d21afe85d03563b61e1d543c95b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Safe serialization & reconciliation when no account resources

- [#1117](https://github.com/LedgerHQ/ledger-live/pull/1117) [`f228bbdf0`](https://github.com/LedgerHQ/ledger-live/commit/f228bbdf063640770d3baa71ea610483c7380a72) Thanks [@github-actions](https://github.com/apps/github-actions)! - New BLE pairing flow

  Not yet used in production. Accessible from the debug menu.

  Features:

  - scanning and pairing: one screen to go to from anywhere
  - navigate to after pairing success: configuration of the screen (and its associated navigator) with params and name of the route param that will have newly paired device info
  - scanning: filtering on device models
  - scanning: filtering out or displaying already known devices
  - pairing: new animation for pairing (lotties placeholders for now)
  - pairing: possibility to add (or not) the newly paired device to the "known devices" of the app (redux store)

* [#956](https://github.com/LedgerHQ/ledger-live/pull/956) [`d6634bc0b`](https://github.com/LedgerHQ/ledger-live/commit/d6634bc0b720d8a13f3681caf33e2f23d5c64968) Thanks [@pavanvora](https://github.com/pavanvora)! - fix estimateMaxSpendable for Cardano

- [#1083](https://github.com/LedgerHQ/ledger-live/pull/1083) [`5da717c52`](https://github.com/LedgerHQ/ledger-live/commit/5da717c523db7678edeb0f86bdfa88256dfe96c4) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing safety check on bitcoinResources

* [#1109](https://github.com/LedgerHQ/ledger-live/pull/1109) [`8fe44e12d`](https://github.com/LedgerHQ/ledger-live/commit/8fe44e12d73fe96636282666dd8f3b02ef96d0e6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Switch Ethereum Goerli explorer env from staging to prod

* Updated dependencies [[`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754), [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`318e80452`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd), [`e80336b28`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`5dd957b3c`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0)]:
  - @ledgerhq/cryptoassets@6.34.0
  - @ledgerhq/hw-app-eth@6.29.6

## 27.1.0-next.6

### Minor Changes

- [#1155](https://github.com/LedgerHQ/ledger-live/pull/1155) [`3849ee3f30`](https://github.com/LedgerHQ/ledger-live/commit/3849ee3f30987b51d648ce29bfee4721f4ddff5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add requirement to cosmos banner

## 27.1.0-next.5

### Patch Changes

- [#1097](https://github.com/LedgerHQ/ledger-live/pull/1097) [`936b6dc545`](https://github.com/LedgerHQ/ledger-live/commit/936b6dc5450fcd69a31e03fa2040346d512c0912) Thanks [@alexandremgo](https://github.com/alexandremgo)! - New BLE pairing flow

  Not yet used in production. Accessible from the debug menu.

  Features:

  - scanning and pairing: one screen to go to from anywhere
  - navigate to after pairing success: configuration of the screen (and its associated navigator) with params and name of the route param that will have newly paired device info
  - scanning: filtering on device models
  - scanning: filtering out or displaying already known devices
  - pairing: new animation for pairing (lotties placeholders for now)
  - pairing: possibility to add (or not) the newly paired device to the "known devices" of the app (redux store)

## 27.1.0-next.4

### Minor Changes

- [#744](https://github.com/LedgerHQ/ledger-live/pull/744) [`0ebdec50bf`](https://github.com/LedgerHQ/ledger-live/commit/0ebdec50bfca81b2d814726f8f9a82237ad42ffc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add an EVM based family in LLC

## 27.1.0-next.3

### Minor Changes

- [#1059](https://github.com/LedgerHQ/ledger-live/pull/1059) [`685348dd35`](https://github.com/LedgerHQ/ledger-live/commit/685348dd351181a9ed7f23cedb3e3d289b16fe9e) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix glitch on tx value when sending tokens

* [#963](https://github.com/LedgerHQ/ledger-live/pull/963) [`dd538c3723`](https://github.com/LedgerHQ/ledger-live/commit/dd538c3723853334ce19a89353f20766432d12fd) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - replace cbor lib to get rid of BigInt type

- [#1072](https://github.com/LedgerHQ/ledger-live/pull/1072) [`0601b6541f`](https://github.com/LedgerHQ/ledger-live/commit/0601b6541f10635aea72f916626432a334aa49fa) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - display fees on historical transactions properly

## 27.1.0-next.2

### Minor Changes

- [#1017](https://github.com/LedgerHQ/ledger-live/pull/1017) [`21ed0bd521`](https://github.com/LedgerHQ/ledger-live/commit/21ed0bd5219a3629abc0bbb547fc4d75f5e71300) Thanks [@sarneijim](https://github.com/sarneijim)! - Add cosmos account banner util

### Patch Changes

- [#1109](https://github.com/LedgerHQ/ledger-live/pull/1109) [`8fe44e12d7`](https://github.com/LedgerHQ/ledger-live/commit/8fe44e12d73fe96636282666dd8f3b02ef96d0e6) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Switch Ethereum Goerli explorer env from staging to prod

## 27.1.0-next.1

### Minor Changes

- [#669](https://github.com/LedgerHQ/ledger-live/pull/669) [`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754) Thanks [@andyhass](https://github.com/andyhass)! - Add Celo Staking

* [#954](https://github.com/LedgerHQ/ledger-live/pull/954) [`336eb879a8`](https://github.com/LedgerHQ/ledger-live/commit/336eb879a80573fd81027232c4c6c9b383bd2a97) Thanks [@andyhass](https://github.com/andyhass)! - The Ledger QA team discovered that an error could occur when calculating the max spendable and max non-voting locked balance when pending operations existed. These balances are set when the account syncs, and these balances will not take into account pending operations - leaving it to be higher than it truly is. This results in a runtime error related to trying to create a transaction that is larger than the respective balance.

- [#856](https://github.com/LedgerHQ/ledger-live/pull/856) [`3615a06f19`](https://github.com/LedgerHQ/ledger-live/commit/3615a06f19ef659480d50a1a1a28f6df952b117a) Thanks [@andyhass](https://github.com/andyhass)! - Gracefully handle when user reaches the maximum number of Celo validator groups they can vote for.

### Patch Changes

- Updated dependencies [[`b615140ba2`](https://github.com/LedgerHQ/ledger-live/commit/b615140ba2e326e1466d15f123d412ea90db3754)]:
  - @ledgerhq/cryptoassets@6.34.0-next.1
  - @ledgerhq/hw-app-eth@6.29.6-next.1

## 27.0.1-next.0

### Patch Changes

- [#1025](https://github.com/LedgerHQ/ledger-live/pull/1025) [`7e812a738d`](https://github.com/LedgerHQ/ledger-live/commit/7e812a738db718200138dcb9b7bcc2f6dd0ddd6f) Thanks [@alexandremgo](https://github.com/alexandremgo)! - feat: hooks for genuine check and get latest available firmware

* [#1092](https://github.com/LedgerHQ/ledger-live/pull/1092) [`058a1af7ff`](https://github.com/LedgerHQ/ledger-live/commit/058a1af7ff463d21afe85d03563b61e1d543c95b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Safe serialization & reconciliation when no account resources

- [#956](https://github.com/LedgerHQ/ledger-live/pull/956) [`d6634bc0b7`](https://github.com/LedgerHQ/ledger-live/commit/d6634bc0b720d8a13f3681caf33e2f23d5c64968) Thanks [@pavanvora](https://github.com/pavanvora)! - fix estimateMaxSpendable for Cardano

* [#1083](https://github.com/LedgerHQ/ledger-live/pull/1083) [`5da717c523`](https://github.com/LedgerHQ/ledger-live/commit/5da717c523db7678edeb0f86bdfa88256dfe96c4) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add missing safety check on bitcoinResources

* Updated dependencies [[`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`318e804525`](https://github.com/LedgerHQ/ledger-live/commit/318e80452569a0f91c4363ae50d2664419251dbd), [`e80336b284`](https://github.com/LedgerHQ/ledger-live/commit/e80336b28478b3eca7a1c477b43cc512ba38a710), [`5dd957b3cb`](https://github.com/LedgerHQ/ledger-live/commit/5dd957b3cb893668f044497d25b6eee69b05b2f0)]:
  - @ledgerhq/cryptoassets@6.34.0-next.0
  - @ledgerhq/hw-app-eth@6.29.6-next.0

## 26.0.0

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

### Minor Changes

- [#764](https://github.com/LedgerHQ/ledger-live/pull/764) [`ebe1adfb7d`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development firmware detection to getDeviceInfo

* [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

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

### Patch Changes

- [#665](https://github.com/LedgerHQ/ledger-live/pull/665) [`37159cbb9e`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update @polkadot dependencies

* [#664](https://github.com/LedgerHQ/ledger-live/pull/664) [`3dbd4d0781`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update taquito dependency

- [#803](https://github.com/LedgerHQ/ledger-live/pull/803) [`1a33d8641f`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Reduce limit param in Stellar requests to avoid 503 "object too large" errors from infra

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#850](https://github.com/LedgerHQ/ledger-live/pull/850) [`f4b7894426`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - cardano address validation fix

* [#779](https://github.com/LedgerHQ/ledger-live/pull/779) [`97eab434de`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Refactoring of useOnboardingStatePolling bringing 2 changes:

  - avoid re-rendering: the hook only updates its result on a new onboardingState or new allowedError, not at every run
  - update of useOnboardingStatePolling args: getOnboardingStatePolling as an optional injected dependency to the hook. It is needed for LLD to have the polling working on the internal thread. It is set by default to live-common/hw/getOnboardingStatePolling so it is not needed to pass it as an arg to use the hook on LLM.

* Updated dependencies [[`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1), [`e2a9cfad63`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b)]:
  - @ledgerhq/cryptoassets@6.32.0
  - @ledgerhq/hw-app-eth@6.29.4

## 27.0.0

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

* [#998](https://github.com/LedgerHQ/ledger-live/pull/998) [`c7aaafa769`](https://github.com/LedgerHQ/ledger-live/commit/c7aaafa76924252f3c7e30371012bd0e69d8100a) Thanks [@github-actions](https://github.com/apps/github-actions)! - Added development/QA tool for feature flags [Desktop]

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

### Patch Changes

- [#998](https://github.com/LedgerHQ/ledger-live/pull/998) [`f47b2b1f47`](https://github.com/LedgerHQ/ledger-live/commit/f47b2b1f47c2256ad006ed35db9a0935e87cd503) Thanks [@github-actions](https://github.com/apps/github-actions)! - LLM: fixes import from desktop to fully sync accounts before save

* [#730](https://github.com/LedgerHQ/ledger-live/pull/730) [`6e057f7163`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4) Thanks [@LFBarreto](https://github.com/LFBarreto)! - update ptx smart routing feature flag and live app web player undefined uri params

- [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

- Updated dependencies [[`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1), [`ecfdd1ebd8`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/cryptoassets@6.33.0
  - @ledgerhq/hw-transport@6.27.3
  - @ledgerhq/hw-app-eth@6.29.5
  - @ledgerhq/hw-app-algorand@6.27.3
  - @ledgerhq/hw-app-btc@8.0.1
  - @ledgerhq/hw-app-cosmos@6.27.3
  - @ledgerhq/hw-app-polkadot@6.27.3
  - @ledgerhq/hw-app-solana@6.27.3
  - @ledgerhq/hw-app-str@6.27.3
  - @ledgerhq/hw-app-tezos@6.27.3
  - @ledgerhq/hw-app-trx@6.27.3
  - @ledgerhq/hw-app-xrp@6.27.3
  - @ledgerhq/hw-transport-mocker@6.27.3
  - @ledgerhq/hw-transport-node-speculos@6.27.3

## 27.0.0-next.3

### Patch Changes

- [#998](https://github.com/LedgerHQ/ledger-live/pull/998) [`f47b2b1f47`](https://github.com/LedgerHQ/ledger-live/commit/f47b2b1f47c2256ad006ed35db9a0935e87cd503) Thanks [@github-actions](https://github.com/apps/github-actions)! - LLM: fixes import from desktop to fully sync accounts before save

## 27.0.0-next.2

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

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

### Patch Changes

- Updated dependencies [[`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/cryptoassets@6.33.0-next.0
  - @ledgerhq/hw-app-eth@6.29.5-next.1

## 26.1.0-next.1

### Minor Changes

- [#492](https://github.com/LedgerHQ/ledger-live/pull/492) [`d679e5feeb`](https://github.com/LedgerHQ/ledger-live/commit/d679e5feebc02e7cd138e1026b7bad5392866ea2) Thanks [@grsoares21](https://github.com/grsoares21)! - Adds device action logic for installing and uninstalling language packs

## 26.1.0-next.0

### Minor Changes

- [#814](https://github.com/LedgerHQ/ledger-live/pull/814) [`23c9bf994`](https://github.com/LedgerHQ/ledger-live/commit/23c9bf9949169d31d534f12dca48e21e35df05b2) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development/QA tool for feature flags [Desktop]

### Patch Changes

- [#730](https://github.com/LedgerHQ/ledger-live/pull/730) [`6e057f716`](https://github.com/LedgerHQ/ledger-live/commit/6e057f7163dc53658604429e3e6c8057ae9988f4) Thanks [@LFBarreto](https://github.com/LFBarreto)! - update ptx smart routing feature flag and live app web player undefined uri params

* [#970](https://github.com/LedgerHQ/ledger-live/pull/970) [`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311) Thanks [@alexandremgo](https://github.com/alexandremgo)! - BLE scanning and pairing hooks

* Updated dependencies [[`ecfdd1ebd`](https://github.com/LedgerHQ/ledger-live/commit/ecfdd1ebd8cc7c4b5bc6315316ce662bb6241311)]:
  - @ledgerhq/hw-transport@6.27.3-next.0
  - @ledgerhq/hw-app-algorand@6.27.3-next.0
  - @ledgerhq/hw-app-btc@8.0.1-next.0
  - @ledgerhq/hw-app-cosmos@6.27.3-next.0
  - @ledgerhq/hw-app-eth@6.29.5-next.0
  - @ledgerhq/hw-app-polkadot@6.27.3-next.0
  - @ledgerhq/hw-app-solana@6.27.3-next.0
  - @ledgerhq/hw-app-str@6.27.3-next.0
  - @ledgerhq/hw-app-tezos@6.27.3-next.0
  - @ledgerhq/hw-app-trx@6.27.3-next.0
  - @ledgerhq/hw-app-xrp@6.27.3-next.0
  - @ledgerhq/hw-transport-mocker@6.27.3-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.3-next.0

## 26.0.0

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de865`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

### Minor Changes

- [#764](https://github.com/LedgerHQ/ledger-live/pull/764) [`ebe1adfb7d`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development firmware detection to getDeviceInfo

* [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

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

### Patch Changes

- [#665](https://github.com/LedgerHQ/ledger-live/pull/665) [`37159cbb9e`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update @polkadot dependencies

* [#664](https://github.com/LedgerHQ/ledger-live/pull/664) [`3dbd4d0781`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update taquito dependency

- [#803](https://github.com/LedgerHQ/ledger-live/pull/803) [`1a33d8641f`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Reduce limit param in Stellar requests to avoid 503 "object too large" errors from infra

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb94`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#850](https://github.com/LedgerHQ/ledger-live/pull/850) [`f4b7894426`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - cardano address validation fix

* [#779](https://github.com/LedgerHQ/ledger-live/pull/779) [`97eab434de`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Refactoring of useOnboardingStatePolling bringing 2 changes:

  - avoid re-rendering: the hook only updates its result on a new onboardingState or new allowedError, not at every run
  - update of useOnboardingStatePolling args: getOnboardingStatePolling as an optional injected dependency to the hook. It is needed for LLD to have the polling working on the internal thread. It is set by default to live-common/hw/getOnboardingStatePolling so it is not needed to pass it as an arg to use the hook on LLM.

* Updated dependencies [[`134355d561`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`0c12f3e897`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1), [`e2a9cfad63`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b)]:
  - @ledgerhq/cryptoassets@6.32.0
  - @ledgerhq/hw-app-eth@6.29.4

## 26.0.0-next.2

### Major Changes

- [#918](https://github.com/LedgerHQ/ledger-live/pull/918) [`a36d1de86`](https://github.com/LedgerHQ/ledger-live/commit/a36d1de865fd318051c46335d1c86f5cf12b2100) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - fix useAllAmount usage when fees are higher than balance

## 25.2.0-next.1

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

### Patch Changes

- Updated dependencies [[`0c12f3e89`](https://github.com/LedgerHQ/ledger-live/commit/0c12f3e897527265ec86f688368d6d46340759a1)]:
  - @ledgerhq/cryptoassets@6.32.0-next.1
  - @ledgerhq/hw-app-eth@6.29.4-next.1

## 25.2.0-next.0

### Minor Changes

- [#764](https://github.com/LedgerHQ/ledger-live/pull/764) [`ebe1adfb7`](https://github.com/LedgerHQ/ledger-live/commit/ebe1adfb7d264da0f8c9e30b84c188eaa931d1e6) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Added development firmware detection to getDeviceInfo

* [#451](https://github.com/LedgerHQ/ledger-live/pull/451) [`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Type libraries usage in LLC, LLD, LLM, CLI

### Patch Changes

- [#665](https://github.com/LedgerHQ/ledger-live/pull/665) [`37159cbb9`](https://github.com/LedgerHQ/ledger-live/commit/37159cbb9e0023b65593e4ed71557f80bf48989e) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update @polkadot dependencies

* [#664](https://github.com/LedgerHQ/ledger-live/pull/664) [`3dbd4d078`](https://github.com/LedgerHQ/ledger-live/commit/3dbd4d0781569cd0bfce575854e706def2bd951f) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update taquito dependency

- [#803](https://github.com/LedgerHQ/ledger-live/pull/803) [`1a33d8641`](https://github.com/LedgerHQ/ledger-live/commit/1a33d8641f9d1b4e4adfa262a179f124918e0ff5) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Reduce limit param in Stellar requests to avoid 503 "object too large" errors from infra

* [#882](https://github.com/LedgerHQ/ledger-live/pull/882) [`807f3feb9`](https://github.com/LedgerHQ/ledger-live/commit/807f3feb947ffd31d47d43b5aa7b8e85f2bbf6d8) Thanks [@Justkant](https://github.com/Justkant)! - fix: bump platform API version [LIVE-3181]

- [#850](https://github.com/LedgerHQ/ledger-live/pull/850) [`f4b789442`](https://github.com/LedgerHQ/ledger-live/commit/f4b7894426341f5b909ba3a2422ae2b8ecf31466) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - cardano address validation fix

* [#779](https://github.com/LedgerHQ/ledger-live/pull/779) [`97eab434d`](https://github.com/LedgerHQ/ledger-live/commit/97eab434dee361716588b256146665c99c274af9) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Refactoring of useOnboardingStatePolling bringing 2 changes:

  - avoid re-rendering: the hook only updates its result on a new onboardingState or new allowedError, not at every run
  - update of useOnboardingStatePolling args: getOnboardingStatePolling as an optional injected dependency to the hook. It is needed for LLD to have the polling working on the internal thread. It is set by default to live-common/hw/getOnboardingStatePolling so it is not needed to pass it as an arg to use the hook on LLM.

* Updated dependencies [[`134355d56`](https://github.com/LedgerHQ/ledger-live/commit/134355d561bd8d576123d51f99cb5058be5721a4), [`e2a9cfad6`](https://github.com/LedgerHQ/ledger-live/commit/e2a9cfad63f3c8fddf4660942a53545eabb03d6b)]:
  - @ledgerhq/cryptoassets@6.32.0-next.0
  - @ledgerhq/hw-app-eth@6.29.4-next.0

## 25.1.0

### Minor Changes

- [#731](https://github.com/LedgerHQ/ledger-live/pull/731) [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update UI for manager app install/uninstall buttons

* [#507](https://github.com/LedgerHQ/ledger-live/pull/507) [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Push notifications support added to ledger live mobile, new 'notifications' section added to the settings to enable or disable them, new modal added to ask the user if he wants to allow the notifications

### Patch Changes

- [#709](https://github.com/LedgerHQ/ledger-live/pull/709) [`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update Polkadot app minimum version to 13.9250.0

* [#673](https://github.com/LedgerHQ/ledger-live/pull/673) [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c) Thanks [@gre](https://github.com/gre)! - Introduce env TEZOS_MAX_TX_QUERIES to configure safe max amount of transaction http fetches for a tezos sync. Increase the default to 100.

- [#748](https://github.com/LedgerHQ/ledger-live/pull/748) [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixing support for EIP-712 in hw-signMessage for walletconnect and SDK

* [#707](https://github.com/LedgerHQ/ledger-live/pull/707) [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add a bridge test for AmountRequired error

* Updated dependencies [[`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58)]:
  - @ledgerhq/cryptoassets@6.31.0
  - @ledgerhq/hw-app-eth@6.29.3

## 25.1.0-next.2

### Minor Changes

- [#507](https://github.com/LedgerHQ/ledger-live/pull/507) [`3bdbfd3cb`](https://github.com/LedgerHQ/ledger-live/commit/3bdbfd3cbc0153a2ebf4ab91f631cb9f6e42d74c) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Push notifications support added to ledger live mobile, new 'notifications' section added to the settings to enable or disable them, new modal added to ask the user if he wants to allow the notifications

## 25.1.0-next.1

### Minor Changes

- [#731](https://github.com/LedgerHQ/ledger-live/pull/731) [`0e115ae5c`](https://github.com/LedgerHQ/ledger-live/commit/0e115ae5cd7ddcc728d9f435dc4084cedb53beed) Thanks [@juan-cortes](https://github.com/juan-cortes)! - Update UI for manager app install/uninstall buttons

## 25.0.1-next.0

### Patch Changes

- [#709](https://github.com/LedgerHQ/ledger-live/pull/709) [`f10d01171`](https://github.com/LedgerHQ/ledger-live/commit/f10d01171f4c0869d1d82e6cc5402da9ca80990b) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update Polkadot app minimum version to 13.9250.0

* [#673](https://github.com/LedgerHQ/ledger-live/pull/673) [`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c) Thanks [@gre](https://github.com/gre)! - Introduce env TEZOS_MAX_TX_QUERIES to configure safe max amount of transaction http fetches for a tezos sync. Increase the default to 100.

- [#748](https://github.com/LedgerHQ/ledger-live/pull/748) [`8afb69530`](https://github.com/LedgerHQ/ledger-live/commit/8afb69530292fa1f41f2fc78b38639134b1fe16f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fixing support for EIP-712 in hw-signMessage for walletconnect and SDK

* [#707](https://github.com/LedgerHQ/ledger-live/pull/707) [`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add a bridge test for AmountRequired error

* Updated dependencies [[`3eeb1e18c`](https://github.com/LedgerHQ/ledger-live/commit/3eeb1e18c883eca22201fb0d882799e2f6667b58)]:
  - @ledgerhq/cryptoassets@6.31.0-next.0
  - @ledgerhq/hw-app-eth@6.29.3-next.0

## 25.0.0

### Major Changes

- [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

### Minor Changes

- [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

* [#602](https://github.com/LedgerHQ/ledger-live/pull/602) [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Accept new message.sign call from the live-app-sdk

- [#460](https://github.com/LedgerHQ/ledger-live/pull/460) [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Create index in real time instead of loading from app.json for btc wallet. Fix bug: https://ledgerhq.atlassian.net/browse/LIVE-2495

* [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

- [#624](https://github.com/LedgerHQ/ledger-live/pull/624) [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add Searching bar for validators list of ATOM and SOL

* [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add memo capability to hedera coin family.

### Patch Changes

- [#486](https://github.com/LedgerHQ/ledger-live/pull/486) [`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLC - Countervalues API - updated pairs method to use new GET format

* [#627](https://github.com/LedgerHQ/ledger-live/pull/627) [`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix undefined xpub bug and the field "hash" to "id" migration bug

- [#547](https://github.com/LedgerHQ/ledger-live/pull/547) [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f) Thanks [@gre](https://github.com/gre)! - Improve stacktrace in custom errors

- Updated dependencies [[`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b), [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/cryptoassets@6.30.0
  - @ledgerhq/errors@6.10.1
  - @ledgerhq/devices@7.0.0
  - @ledgerhq/hw-app-btc@8.0.0
  - @ledgerhq/hw-app-eth@6.29.2
  - @ledgerhq/hw-app-algorand@6.27.2
  - @ledgerhq/hw-app-cosmos@6.27.2
  - @ledgerhq/hw-app-polkadot@6.27.2
  - @ledgerhq/hw-app-solana@6.27.2
  - @ledgerhq/hw-app-trx@6.27.2
  - @ledgerhq/hw-transport@6.27.2
  - @ledgerhq/hw-transport-node-speculos@6.27.2
  - @ledgerhq/hw-app-str@6.27.2
  - @ledgerhq/hw-app-tezos@6.27.2
  - @ledgerhq/hw-app-xrp@6.27.2
  - @ledgerhq/hw-transport-mocker@6.27.2

## 25.0.0-next.6

### Minor Changes

- [#624](https://github.com/LedgerHQ/ledger-live/pull/624) [`947c33140`](https://github.com/LedgerHQ/ledger-live/commit/947c33140e906ca35bf1fbfdf7831e28fe99dd67) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Add Searching bar for validators list of ATOM and SOL

## 25.0.0-next.5

### Minor Changes

- [#462](https://github.com/LedgerHQ/ledger-live/pull/462) [`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Cardano tokens in LLD

### Patch Changes

- Updated dependencies [[`816f2b7e9`](https://github.com/LedgerHQ/ledger-live/commit/816f2b7e942967bf0ed670dc43464521bd0b5d01)]:
  - @ledgerhq/cryptoassets@6.30.0-next.2
  - @ledgerhq/hw-app-eth@6.29.2-next.2

## 25.0.0-next.4

### Minor Changes

- [#104](https://github.com/LedgerHQ/ledger-live/pull/104) [`6adbe47e2`](https://github.com/LedgerHQ/ledger-live/commit/6adbe47e2d3037a9a53e5a59b4198f265f644bdf) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add memo capability to hedera coin family.

## 25.0.0-next.3

### Minor Changes

- [#81](https://github.com/LedgerHQ/ledger-live/pull/81) [`76b2825e8`](https://github.com/LedgerHQ/ledger-live/commit/76b2825e84730e9d5a2f7906abd7c00a191de4db) Thanks [@JunichiSugiura](https://github.com/JunichiSugiura)! - feat: add ERC20 token support to the Platform API

## 25.0.0-next.2

### Patch Changes

- [#486](https://github.com/LedgerHQ/ledger-live/pull/486) [`345706e24`](https://github.com/LedgerHQ/ledger-live/commit/345706e24e91ba4c397d4a6ffc1b2b174a0ddc84) Thanks [@LFBarreto](https://github.com/LFBarreto)! - LLC - Countervalues API - updated pairs method to use new GET format

## 25.0.0-next.1

### Minor Changes

- [#471](https://github.com/LedgerHQ/ledger-live/pull/471) [`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Add support of Stellar assets (tokens)

### Patch Changes

- Updated dependencies [[`03da88df2`](https://github.com/LedgerHQ/ledger-live/commit/03da88df2f9c06c054081dcbf34226cb440809c0)]:
  - @ledgerhq/cryptoassets@6.30.0-next.1
  - @ledgerhq/hw-app-eth@6.29.2-next.1

## 25.0.0-next.0

### Major Changes

- [#364](https://github.com/LedgerHQ/ledger-live/pull/364) [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8) Thanks [@elbywan](https://github.com/elbywan)! - #### Replace [webpack](https://webpack.js.org/) with [vite.js](https://vitejs.dev/) to speed up the ledger live desktop development process.

  To fully embrace the "bundleless" vite.js approach, it is necessary to transpile our packages contained in the monorepository to the ESM format, and [subpath exports](https://nodejs.org/api/packages.html#subpath-exports) have been added to silently map to commonjs or esm depending on the need.

  #### 🔥 BREAKING CHANGES for `@ledgerhq/live-common`, `@ledgerhq/devices` and `@ledgerhq/hw-app-btc` consumers.

  As highlighted [here](https://github.com/nodejs/node#39994), it is not possible to target folders directly when using subpath exports.

  The workaround is to suffix the call with `/index` (or `/`).

  For instance…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies";
  ```

  …must be rewritten to…

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/index;";
  ```

  …or:

  ```ts
  import * as currencies from "@ledgerhq/live-common/currencies/;";
  ```

### Minor Changes

- [#602](https://github.com/LedgerHQ/ledger-live/pull/602) [`7c15869a7`](https://github.com/LedgerHQ/ledger-live/commit/7c15869a7a2cf74f849f8cf0fe13b66133ff673a) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Accept new message.sign call from the live-app-sdk

* [#460](https://github.com/LedgerHQ/ledger-live/pull/460) [`e4b7dc326`](https://github.com/LedgerHQ/ledger-live/commit/e4b7dc32664d32b43dfae2821c29715ae94a6ab4) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Create index in real time instead of loading from app.json for btc wallet. Fix bug: https://ledgerhq.atlassian.net/browse/LIVE-2495

### Patch Changes

- [#627](https://github.com/LedgerHQ/ledger-live/pull/627) [`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix undefined xpub bug and the field "hash" to "id" migration bug

* [#547](https://github.com/LedgerHQ/ledger-live/pull/547) [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f) Thanks [@gre](https://github.com/gre)! - Improve stacktrace in custom errors

* Updated dependencies [[`e142b9484`](https://github.com/LedgerHQ/ledger-live/commit/e142b9484e6371539fb392c002e1ebaf7802542b), [`203b927b4`](https://github.com/LedgerHQ/ledger-live/commit/203b927b4e5bca3402c85a88c536d519adb18c5f), [`f538d2974`](https://github.com/LedgerHQ/ledger-live/commit/f538d29745669b2aada6ac34f37cd404c23cf1b8)]:
  - @ledgerhq/cryptoassets@6.30.0-next.0
  - @ledgerhq/errors@6.10.1-next.0
  - @ledgerhq/devices@7.0.0-next.0
  - @ledgerhq/hw-app-btc@8.0.0-next.0
  - @ledgerhq/hw-app-eth@6.29.2-next.0
  - @ledgerhq/hw-app-algorand@6.27.2-next.0
  - @ledgerhq/hw-app-cosmos@6.27.2-next.0
  - @ledgerhq/hw-app-polkadot@6.27.2-next.0
  - @ledgerhq/hw-app-solana@6.27.2-next.0
  - @ledgerhq/hw-app-trx@6.27.2-next.0
  - @ledgerhq/hw-transport@6.27.2-next.0
  - @ledgerhq/hw-transport-node-speculos@6.27.2-next.0
  - @ledgerhq/hw-app-str@6.27.2-next.0
  - @ledgerhq/hw-app-tezos@6.27.2-next.0
  - @ledgerhq/hw-app-xrp@6.27.2-next.0
  - @ledgerhq/hw-transport-mocker@6.27.2-next.0

## 24.1.0

### Minor Changes

- [#346](https://github.com/LedgerHQ/ledger-live/pull/346) [`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Synchronized onboarding logic with:

  - Function to extract the device onboarding state from byte flags
  - Polling mechanism to retrieve the device onboarding state
  - Polling mechanism available as a react hook for LLM and LLD

* [#525](https://github.com/LedgerHQ/ledger-live/pull/525) [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Filter added to empty delegation inside array when amount is egal to zero

### Patch Changes

- [#560](https://github.com/LedgerHQ/ledger-live/pull/560) [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix crash when there is a transaction with no input for bitcoin. LIVE-2748

* [#408](https://github.com/LedgerHQ/ledger-live/pull/408) [`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix reorg causing a failed incremental sync if latest stable operaton block hash doesn't exist on chain

* Updated dependencies [[`89387dee6`](https://github.com/LedgerHQ/ledger-live/commit/89387dee6dfc2a63fa29665ab5524f3950d3ce0e)]:
  - @ledgerhq/hw-app-btc@7.0.0

## 24.1.0-next.1

### Patch Changes

- [#408](https://github.com/LedgerHQ/ledger-live/pull/408) [`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix reorg causing a failed incremental sync if latest stable operaton block hash doesn't exist on chain

## 24.1.0-next.0

### Minor Changes

- [#346](https://github.com/LedgerHQ/ledger-live/pull/346) [`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b) Thanks [@alexandremgo](https://github.com/alexandremgo)! - Synchronized onboarding logic with:

  - Function to extract the device onboarding state from byte flags
  - Polling mechanism to retrieve the device onboarding state
  - Polling mechanism available as a react hook for LLM and LLD

* [#525](https://github.com/LedgerHQ/ledger-live/pull/525) [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe) Thanks [@laure-lebon](https://github.com/laure-lebon)! - Filter added to empty delegation inside array when amount is egal to zero

### Patch Changes

- [#560](https://github.com/LedgerHQ/ledger-live/pull/560) [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix crash when there is a transaction with no input for bitcoin. LIVE-2748

- Updated dependencies [[`89387dee6`](https://github.com/LedgerHQ/ledger-live/commit/89387dee6dfc2a63fa29665ab5524f3950d3ce0e)]:
  - @ledgerhq/hw-app-btc@7.0.0-next.0

## 24.0.0

### Major Changes

- [#352](https://github.com/LedgerHQ/ledger-live/pull/352) [`b1e396dd8`](https://github.com/LedgerHQ/ledger-live/commit/b1e396dd89ca2787978dc7e53b7ca865133a1961) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - satstack issue fix Jira ticket: LIVE-2208 and LIVE-2170

* [#360](https://github.com/LedgerHQ/ledger-live/pull/360) [`e9decc277`](https://github.com/LedgerHQ/ledger-live/commit/e9decc27785fb07972460494c8ef39e92b0127a1) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - change tags for glif derivation modes

### Minor Changes

- [#321](https://github.com/LedgerHQ/ledger-live/pull/321) [`c5714333b`](https://github.com/LedgerHQ/ledger-live/commit/c5714333bdb1c90a29c20c7e5793184d89967142) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding optimistic operations to NFT transfers

* [#375](https://github.com/LedgerHQ/ledger-live/pull/375) [`d22452817`](https://github.com/LedgerHQ/ledger-live/commit/d224528174313bc4975e62d015adf928d4315620) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - Fix Tezos synchronisation with originating type

- [#385](https://github.com/LedgerHQ/ledger-live/pull/385) [`5145781e5`](https://github.com/LedgerHQ/ledger-live/commit/5145781e599fcb64be13695620988951bb805a3e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - NFT counter value added on LLM and LLD with feature flagging

* [#502](https://github.com/LedgerHQ/ledger-live/pull/502) [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Bitcoin Rbf new implementation. Jira ticket: LIVE-1414, LIVE-1415, LIVE-1416

- [#453](https://github.com/LedgerHQ/ledger-live/pull/453) [`10440ec3c`](https://github.com/LedgerHQ/ledger-live/commit/10440ec3c2bffa7ce8636a7838680bb3501ffe0d) Thanks [@henrily-ledger](https://github.com/henrily-ledger)! - XRP: add retry to api call

* [#399](https://github.com/LedgerHQ/ledger-live/pull/399) [`e1f2f07a2`](https://github.com/LedgerHQ/ledger-live/commit/e1f2f07a2ba1de5eab6fa10c4c800b7097c8037d) Thanks [@pavanvora](https://github.com/pavanvora)! - fix(LLC): cardano byron address validation

- [#158](https://github.com/LedgerHQ/ledger-live/pull/158) [`508e4c23b`](https://github.com/LedgerHQ/ledger-live/commit/508e4c23babd04c48e7b626ef4004fb55f3c1ba9) Thanks [@alexalouit](https://github.com/alexalouit)! - Update ledger-live-common dependency stellar-sdk to v10.1.1

### Patch Changes

- [#73](https://github.com/LedgerHQ/ledger-live/pull/73) [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2) Thanks [@chabroA](https://github.com/chabroA)! - Handle all non final (i.e: non OK nor KO) status as pending

* [#199](https://github.com/LedgerHQ/ledger-live/pull/199) [`22531f3c3`](https://github.com/LedgerHQ/ledger-live/commit/22531f3c377191d56bc5d5635f1174fb32b01957) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Update expected steps labels for Cosmos device actions

- [#418](https://github.com/LedgerHQ/ledger-live/pull/418) [`2012b5477`](https://github.com/LedgerHQ/ledger-live/commit/2012b54773b6391f353903564a247ad02be1a296) Thanks [@gre](https://github.com/gre)! - Drop deprecated "Portfolio V1"

* [#73](https://github.com/LedgerHQ/ledger-live/pull/73) [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2) Thanks [@chabroA](https://github.com/chabroA)! - Add loading spinner on "From amount" field in Swap form when using "Send max" toggle

- [#332](https://github.com/LedgerHQ/ledger-live/pull/332) [`1e4a5647b`](https://github.com/LedgerHQ/ledger-live/commit/1e4a5647b39c0f806bc311383b49a246fbe453eb) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Patching shouldUpgrade & mustUpgrade logic to allow for pre-release tags that were considered always considered as false before

- Updated dependencies [[`6e956f22b`](https://github.com/LedgerHQ/ledger-live/commit/6e956f22bdf96f7a902b48a8cd231a34053d459b)]:
  - @ledgerhq/cryptoassets@6.29.0
  - @ledgerhq/hw-app-eth@6.29.1

## 24.0.0-next.4

### Major Changes

- [#502](https://github.com/LedgerHQ/ledger-live/pull/502) [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Bitcoin Rbf new implementation. Jira ticket: LIVE-1414, LIVE-1415, LIVE-1416

## 24.0.0-next.3

### Minor Changes

- 5145781e5: NFT counter value added on LLM and LLD with feature flagging

## 24.0.0-next.2

### Minor Changes

- c5714333b: Adding optimistic operations to NFT transfers

## 24.0.0-next.1

### Patch Changes

- 99cc5bbc1: Handle all non final (i.e: non OK nor KO) status as pending
- 99cc5bbc1: Add loading spinner on "From amount" field in Swap form when using "Send max" toggle

## 24.0.0-next.0

### Major Changes

- b1e396dd8: satstack issue fix Jira ticket: LIVE-2208 and LIVE-2170
- e9decc277: change tags for glif derivation modes

### Minor Changes

- d22452817: Fix Tezos synchronisation with originating type
- 10440ec3c: XRP: add retry to api call
- e1f2f07a2: fix(LLC): cardano byron address validation
- 508e4c23b: Update ledger-live-common dependency stellar-sdk to v10.1.1

### Patch Changes

- 22531f3c3: Update expected steps labels for Cosmos device actions
- 2012b5477: Drop deprecated "Portfolio V1"
- 1e4a5647b: Patching shouldUpgrade & mustUpgrade logic to allow for pre-release tags that were considered always considered as false before
- Updated dependencies [6e956f22b]
  - @ledgerhq/cryptoassets@6.29.0-next.0
  - @ledgerhq/hw-app-eth@6.29.1-next.0

## 23.1.0

### Minor Changes

- 8861c4fe0: upgrade dependencies
- ec5c4fa3d: Fix incremental sync for Cardano, use blockHeight from last operation instead of from account

### Patch Changes

- 8323d2eaa: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]
- bf12e0f65: feat: sell and fund flow [LIVE-784]
- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.
- 78a64769d: Fix experimental EIP712 variable not working correctly

## 23.1.0-next.4

### Patch Changes

- 78a64769d: Fix experimental EIP712 variable not working correctly

## 23.1.0-next.3

### Minor Changes

- ec5c4fa3d: Fix incremental sync for Cardano, use blockHeight from last operation instead of from account

## 23.1.0-next.2

### Patch Changes

- bf12e0f65: feat: sell and fund flow [LIVE-784]

## 23.1.0-next.1

### Patch Changes

- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.

## 23.1.0-next.0

### Minor Changes

- 8861c4fe0: upgrade dependencies

### Patch Changes

- 8323d2eaa: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 23.0.0

### Major Changes

- 64c2fdb06: fix collision between bip44 and glif nomral derivation modes

### Minor Changes

- a66fbe852: import fix for Cardano (ADA) when doing a send it may cause invalid address
- 899aa3300: Use of the maxSpendable for bot testing instead of amount balance
- 89e82ed79: Crypto Icons - Add support for Abachi tokens icons
- 403ea8efe: Update cosmos snapshot
- 98ecc6272: First integration of Cardano (sync/send/receive)
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 8ee9c5568: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]
- 9a86fe231: Fix the click on browse assets button on the market screen
- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading
- b688a592d: fix swap rate formula
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- Updated dependencies [c4be045f9]
  - @ledgerhq/hw-app-eth@6.29.0

## 23.0.0-next.4

### Patch Changes

- 8b2e24b6c: Fixing an issue with WalletConnect not accepting new connection after a first disconnection, resulting in an infite loading

## 23.0.0-next.3

### Minor Changes

- a66fbe852: import fix for Cardano (ADA) when doing a send it may cause invalid address

## 23.0.0-next.2

### Patch Changes

- 8ee9c5568: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 23.0.0-next.1

### Minor Changes

- 98ecc6272: First integration of Cardano (sync/send/receive)

## 23.0.0-next.0

### Major Changes

- 64c2fdb06: fix collision between bip44 and glif nomral derivation modes

### Minor Changes

- 899aa3300: Use of the maxSpendable for bot testing instead of amount balance
- 89e82ed79: Crypto Icons - Add support for Abachi tokens icons
- 403ea8efe: Update cosmos snapshot
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 9a86fe231: Fix the click on browse assets button on the market screen
- b688a592d: fix swap rate formula
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- Updated dependencies [c4be045f9]
  - @ledgerhq/hw-app-eth@6.29.0-next.0

## 22.2.1

### Patch Changes

- 6bcf42ecd: Fix: Infinite Loading Spinner if no nano connected at start of funding flow [LIVE-2447]

## 22.2.0

### Minor Changes

- e0c187073: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb17: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab71: LIVE-1004 Hedera first integration in LLD
- f913f6fdb: LIVE-2162 Solana staking UX improvements
- 9dadffa88: Update cosmos snapshot

### Patch Changes

- 3f816efba: Update stellar-sdk to 10.1.0
- f2574d25d: LIVE-2380 Update min Cosmos Nano app version to 2.34.4
- 04ad3813d: Add missing condition in Account page to check if account type before using isNFTActive helper. Also adds typing and unit tests to all NFT related helpers from live-common.

## 22.2.0-next.2

### Minor Changes

- 9dadffa88: Update cosmos snapshot

## 22.2.0-next.1

### Patch Changes

- 04ad3813d: Add missing condition in Account page to check if account type before using isNFTActive helper. Also adds typing and unit tests to all NFT related helpers from live-common.

## 22.2.0-next.0

### Minor Changes

- e0c18707: Change the NFT Media components and model to use the new image processing feature from our NFT Metadata Provider. We now have multiple images and we're supporting videos.
- ee44ffb1: Cosmos Staking V1 LLD and LLC rework of delegation
- 0252fab7: LIVE-1004 Hedera first integration in LLD
- f913f6fd: LIVE-2162 Solana staking UX improvements

### Patch Changes

- 3f816efb: Update stellar-sdk to 10.1.0
- f2574d25: LIVE-2380 Update min Cosmos Nano app version to 2.34.4

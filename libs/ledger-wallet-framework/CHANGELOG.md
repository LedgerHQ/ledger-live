# @ledgerhq/ledger-wallet-framework

## 3.5.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#21835](https://github.com/LedgerHQ/ledger-live/pull/21835) [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Casper fee estimation now names a valid dummy recipient, which a new test asserts for every family enabled on the generic coin framework.

  Three additions on the way, in preparation for enabling Solana: a family can contribute its own fields to a token sub-account through the new `buildTokenAccountShapes` bridge hook; a fee estimation can propagate a transfer fee, a stake account rent and an owner token account onto the transaction, and a transfer fee is now assigned even when absent, so a fee kept from a previously selected asset can no longer reach the device screen; and a staking position's locked reserve counts towards the staked balance.

  `asset-aggregation` now declares its transitive dependency on `ledger-wallet-framework`, like every other consumer of `live-countervalues`, so its build waits for the framework's declarations.

  No family declares the new hook yet, and no coin module emits the new fee parameters or a locked reserve, so nothing changes on screen beyond the Casper fix.

- [#22272](https://github.com/LedgerHQ/ledger-live/pull/22272) [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: align the zod catalog on 4.4.3

  `@ledgerhq/auth` and `@ledgerhq/wallet-api-core` both depend on zod 4.4.3, so the
  workspace catalog pin at 4.3.6 resolved a second copy of zod into the desktop and
  mobile bundles. Moving the catalog to 4.4.3 collapses the two into one.

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629)]:
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0
  - @ledgerhq/live-currency-format@0.15.0

## 3.4.0

### Minor Changes

- [#21596](https://github.com/LedgerHQ/ledger-live/pull/21596) [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Carry a chain's staking positions through the generic coin framework, and keep sub-accounts
  aligned with what the chain reports:

  - an unbonding position with no validator is no longer dropped from the account's list
  - `extractBalances` rebuilds staking positions, so a family validating a staking intent finds them
  - a position reads as withdrawable only when the chain offers a withdraw on it
  - `mergeSubAccounts` keeps only the sub-accounts the chain still reports, instead of letting a pruned one survive with a stale balance
  - a pending operation shows the user's memo only on a plain transfer

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb)]:
  - @ledgerhq/types-live@6.124.0

## 3.4.0-next.0

### Minor Changes

- [#21596](https://github.com/LedgerHQ/ledger-live/pull/21596) [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Carry a chain's staking positions through the generic coin framework, and keep sub-accounts
  aligned with what the chain reports:

  - an unbonding position with no validator is no longer dropped from the account's list
  - `extractBalances` rebuilds staking positions, so a family validating a staking intent finds them
  - a position reads as withdrawable only when the chain offers a withdraw on it
  - `mergeSubAccounts` keeps only the sub-accounts the chain still reports, instead of letting a pruned one survive with a stale balance
  - a pending operation shows the user's memo only on a plain transfer

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb)]:
  - @ledgerhq/types-live@6.124.0-next.0

## 3.3.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21485](https://github.com/LedgerHQ/ledger-live/pull/21485) [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(framework): align Solana testnet / devnet derivation with mainnet

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/live-currency-format@0.15.0
  - @ledgerhq/live-env@4.0.0

## 3.3.0-next.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21485](https://github.com/LedgerHQ/ledger-live/pull/21485) [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(framework): align Solana testnet / devnet derivation with mainnet

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/live-currency-format@0.15.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 3.2.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/live-env@3.2.0
  - @ledgerhq/live-currency-format@0.14.3

## 3.2.0-next.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0
  - @ledgerhq/live-currency-format@0.14.3-next.0

## 3.1.0

### Minor Changes

- [#20799](https://github.com/LedgerHQ/ledger-live/pull/20799) [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0) Thanks [@ishaba](https://github.com/ishaba)! - Migrate Tron to the generic coin framework (LIVE-34994).

  Adds a per-family pending-operation `extra` to the generic framework: `OptimisticOperationDescriptor` gains an optional `extra` bag and `describeOptimisticOperation` receives the transaction it describes, with framework-reserved keys stripped so a family cannot shadow them.

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/live-env@3.1.0
  - @ledgerhq/live-currency-format@0.14.2

## 3.1.0-next.0

### Minor Changes

- [#20799](https://github.com/LedgerHQ/ledger-live/pull/20799) [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0) Thanks [@ishaba](https://github.com/ishaba)! - Migrate Tron to the generic coin framework (LIVE-34994).

  Adds a per-family pending-operation `extra` to the generic framework: `OptimisticOperationDescriptor` gains an optional `extra` bag and `describeOptimisticOperation` receives the transaction it describes, with framework-reserved keys stripped so a family cannot shadow them.

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0
  - @ledgerhq/live-currency-format@0.14.2-next.0

## 3.0.0

### Major Changes

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

### Minor Changes

- [#20442](https://github.com/LedgerHQ/ledger-live/pull/20442) [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b) Thanks [@ishaba](https://github.com/ishaba)! - feat(generic-coin-framework): add family hooks and fee telemetry

- [#20754](https://github.com/LedgerHQ/ledger-live/pull/20754) [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix an ERC-20 operation staying stuck on "Sending..." after a speed up or a cancel, which also kept
  its amount locked out of the token spendable balance. A replaced transaction can only be retired by
  its nonce, and token operations were not carrying one.

- [#20693](https://github.com/LedgerHQ/ledger-live/pull/20693) [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): expose `tokenIdentifier` through `TokenCurrency`

- [#20538](https://github.com/LedgerHQ/ledger-live/pull/20538) [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e) Thanks [@qperrot](https://github.com/qperrot)! - Honor the gap limit setting during account discovery: count consecutive empty accounts (reset on a used account) so discovery can cross empty gaps to reach later used accounts, and only ever offer the first empty account as creatable

- [#20820](https://github.com/LedgerHQ/ledger-live/pull/20820) [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6) Thanks [@ishaba](https://github.com/ishaba)! - Declare `@ledgerhq/wallet-framework-test-setup` as a devDependency of `@ledgerhq/ledger-wallet-framework`. Its `jest.integ.config.js` already lists the package in `setupFilesAfterEnv`, but it was never a declared dependency, so the `test-integration-pr` workflow's scoped install (`pnpm i --filter="@ledgerhq/ledger-wallet-framework"`) did not link it and the wallet-framework integration tests failed at jest bootstrap with `Module @ledgerhq/wallet-framework-test-setup in the setupFilesAfterEnv option was not found`. Declaring the dependency makes the scoped install include it.

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c)]:
  - @ledgerhq/types-live@6.120.0

## 3.0.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1

## 3.0.0-next.0

### Major Changes

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

### Minor Changes

- [#20442](https://github.com/LedgerHQ/ledger-live/pull/20442) [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b) Thanks [@ishaba](https://github.com/ishaba)! - feat(generic-coin-framework): add family hooks and fee telemetry

- [#20754](https://github.com/LedgerHQ/ledger-live/pull/20754) [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix an ERC-20 operation staying stuck on "Sending..." after a speed up or a cancel, which also kept
  its amount locked out of the token spendable balance. A replaced transaction can only be retired by
  its nonce, and token operations were not carrying one.

- [#20693](https://github.com/LedgerHQ/ledger-live/pull/20693) [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): expose `tokenIdentifier` through `TokenCurrency`

- [#20538](https://github.com/LedgerHQ/ledger-live/pull/20538) [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e) Thanks [@qperrot](https://github.com/qperrot)! - Honor the gap limit setting during account discovery: count consecutive empty accounts (reset on a used account) so discovery can cross empty gaps to reach later used accounts, and only ever offer the first empty account as creatable

- [#20820](https://github.com/LedgerHQ/ledger-live/pull/20820) [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6) Thanks [@ishaba](https://github.com/ishaba)! - Declare `@ledgerhq/wallet-framework-test-setup` as a devDependency of `@ledgerhq/ledger-wallet-framework`. Its `jest.integ.config.js` already lists the package in `setupFilesAfterEnv`, but it was never a declared dependency, so the `test-integration-pr` workflow's scoped install (`pnpm i --filter="@ledgerhq/ledger-wallet-framework"`) did not link it and the wallet-framework integration tests failed at jest bootstrap with `Module @ledgerhq/wallet-framework-test-setup in the setupFilesAfterEnv option was not found`. Declaring the dependency makes the scoped install include it.

### Patch Changes

- Updated dependencies [[`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c)]:
  - @ledgerhq/types-live@6.120.0-next.0

## 2.8.0

### Minor Changes

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/live-currency-format@0.14.1

## 2.8.0-next.0

### Minor Changes

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/live-currency-format@0.14.1

## 2.7.0

### Minor Changes

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

- [#20260](https://github.com/LedgerHQ/ledger-live/pull/20260) [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9) Thanks [@ysitbon](https://github.com/ysitbon)! - Add Zod branded `CryptoCurrencyId`/`TokenCurrencyId` types so a raw string can no longer be passed where a currency id is required without crossing an explicit validation boundary.

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.118.0
  - @ledgerhq/live-currency-format@0.14.1

## 2.7.0-next.0

### Minor Changes

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

- [#20260](https://github.com/LedgerHQ/ledger-live/pull/20260) [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9) Thanks [@ysitbon](https://github.com/ysitbon)! - Add Zod branded `CryptoCurrencyId`/`TokenCurrencyId` types so a raw string can no longer be passed where a currency id is required without crossing an explicit validation boundary.

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.118.0-next.0
  - @ledgerhq/live-currency-format@0.14.1

## 2.6.0

### Minor Changes

- [#19976](https://github.com/LedgerHQ/ledger-live/pull/19976) [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert internal error classes from createCustomErrorClass to native extends Error.

- [#20114](https://github.com/LedgerHQ/ledger-live/pull/20114) [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa) Thanks [@semeano](https://github.com/semeano)! - Add Ironwood support to Zcash

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/types-live@6.117.0
  - @ledgerhq/live-currency-format@0.14.1

## 2.6.0-next.0

### Minor Changes

- [#19976](https://github.com/LedgerHQ/ledger-live/pull/19976) [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert internal error classes from createCustomErrorClass to native extends Error.

- [#20114](https://github.com/LedgerHQ/ledger-live/pull/20114) [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa) Thanks [@semeano](https://github.com/semeano)! - Add Ironwood support to Zcash

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0
  - @ledgerhq/live-currency-format@0.14.1-next.0

## 2.5.0

### Minor Changes

- [#19731](https://github.com/LedgerHQ/ledger-live/pull/19731) [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7) Thanks [@ysitbon](https://github.com/ysitbon)! - Relocate the token-store accessor imports from `@ledgerhq/cryptoassets/state` onto the wallet-framework port (`@ledgerhq/ledger-wallet-framework/cryptoAssetsStore`). Apps and coin-modules now read `getCryptoAssetsStore` from the framework's injectable singleton; apps inject at bootstrap via `setCryptoAssetsStore` from the same port.

### Patch Changes

- Updated dependencies [[`6ed8225`](https://github.com/LedgerHQ/ledger-live/commit/6ed8225f2434f70d587aa046e39262c21b538f27), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @ledgerhq/live-currency-format@0.14.0
  - @ledgerhq/types-live@6.116.0
  - @ledgerhq/live-network@2.7.0

## 2.5.0-next.0

### Minor Changes

- [#19731](https://github.com/LedgerHQ/ledger-live/pull/19731) [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7) Thanks [@ysitbon](https://github.com/ysitbon)! - Relocate the token-store accessor imports from `@ledgerhq/cryptoassets/state` onto the wallet-framework port (`@ledgerhq/ledger-wallet-framework/cryptoAssetsStore`). Apps and coin-modules now read `getCryptoAssetsStore` from the framework's injectable singleton; apps inject at bootstrap via `setCryptoAssetsStore` from the same port.

### Patch Changes

- Updated dependencies [[`6ed8225`](https://github.com/LedgerHQ/ledger-live/commit/6ed8225f2434f70d587aa046e39262c21b538f27), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @ledgerhq/live-currency-format@0.14.0-next.0
  - @ledgerhq/types-live@6.116.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0

## 2.4.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87) Thanks [@ysitbon](https://github.com/ysitbon)! - Expose `getCurrenciesResolver` and bound currency accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByScheme`, `listCryptoCurrencies`, `hasCryptoCurrencyId`) from the `currencies` barrel, and broaden the framework currency types so coin-modules can consume them instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`:

  - `CryptoCurrency` gains `explorerId`/`tokenTypes`; `TokenCurrency` gains `symbol`/`keywords`; `ExplorerView` gains the `tx`/`address`/`token`/`stakePool` fields.
  - New exported types `CryptoCurrencyId`, `LedgerExplorerId`, `FiatCurrency` and `Currency`.

- [#19284](https://github.com/LedgerHQ/ledger-live/pull/19284) [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Align Bittensor (TAO) on the Polkadot derivation path: use CoinType.POLKADOT (354) for the bittensor currency and reuse the polkadotbip44 derivation mode (with disableBIP44). Bittensor reuses the Polkadot app, which derives at 354 and applies the SS58 prefix (42) dynamically.

- [#19229](https://github.com/LedgerHQ/ledger-live/pull/19229) [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove `@ledgerhq/cryptoassets` (value import) from the framework's production dependency surface. The framework now declares injectable port types (`CurrenciesResolver`, `FrameworkCryptoAssetsStore`) that the application composition root wires at bootstrap via `setCurrenciesResolver()` and `setCryptoAssetsStore()`.

- [#19229](https://github.com/LedgerHQ/ledger-live/pull/19229) [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158) Thanks [@ysitbon](https://github.com/ysitbon)! - Define framework-owned `CryptoCurrency`, `TokenCurrency`, and `Unit` structural interfaces in `src/types.ts` and remove the `@ledgerhq/types-cryptoassets` production dependency. The interfaces are structurally compatible with the legacy types, so no call-site changes are needed.

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8)]:
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/live-currency-format@0.13.0
  - @ledgerhq/live-network@2.6.8

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

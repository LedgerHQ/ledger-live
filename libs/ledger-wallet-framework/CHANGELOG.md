# @ledgerhq/ledger-wallet-framework

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

## 2.4.0-next.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87) Thanks [@ysitbon](https://github.com/ysitbon)! - Expose `getCurrenciesResolver` and bound currency accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByScheme`, `listCryptoCurrencies`, `hasCryptoCurrencyId`) from the `currencies` barrel, and broaden the framework currency types so coin-modules can consume them instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`:

  - `CryptoCurrency` gains `explorerId`/`tokenTypes`; `TokenCurrency` gains `symbol`/`keywords`; `ExplorerView` gains the `tx`/`address`/`token`/`stakePool` fields.
  - New exported types `CryptoCurrencyId`, `LedgerExplorerId`, `FiatCurrency` and `Currency`.

- [#19284](https://github.com/LedgerHQ/ledger-live/pull/19284) [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Align Bittensor (TAO) on the Polkadot derivation path: use CoinType.POLKADOT (354) for the bittensor currency and reuse the polkadotbip44 derivation mode (with disableBIP44). Bittensor reuses the Polkadot app, which derives at 354 and applies the SS58 prefix (42) dynamically.

- [#19229](https://github.com/LedgerHQ/ledger-live/pull/19229) [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove `@ledgerhq/cryptoassets` (value import) from the framework's production dependency surface. The framework now declares injectable port types (`CurrenciesResolver`, `FrameworkCryptoAssetsStore`) that the application composition root wires at bootstrap via `setCurrenciesResolver()` and `setCryptoAssetsStore()`.

- [#19229](https://github.com/LedgerHQ/ledger-live/pull/19229) [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158) Thanks [@ysitbon](https://github.com/ysitbon)! - Define framework-owned `CryptoCurrency`, `TokenCurrency`, and `Unit` structural interfaces in `src/types.ts` and remove the `@ledgerhq/types-cryptoassets` production dependency. The interfaces are structurally compatible with the legacy types, so no call-site changes are needed.

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8)]:
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/types-live@6.115.0-next.0
  - @ledgerhq/live-currency-format@0.13.0-next.0
  - @ledgerhq/live-network@2.6.8-next.0

## 2.3.0

### Minor Changes

- [#18630](https://github.com/LedgerHQ/ledger-live/pull/18630) [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - [LWM] feat(mobile): add tracking part 1

- [#19197](https://github.com/LedgerHQ/ledger-live/pull/19197) [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620) Thanks [@lysyi3m](https://github.com/lysyi3m)! - generic-coin-framework: store the account public key in `Account.xpub` (previously the address) for the evm/xrp/stellar/tezos families. Derive `makeSync`'s account-id identity from the immutable account id instead of the mutable `xpub` field, so healing `xpub` to the public key never re-keys or clears accounts. Account ids remain address-based; existing accounts populate `xpub` on the next device-connected scan.

- [#18829](https://github.com/LedgerHQ/ledger-live/pull/18829) [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Sunset the `CryptoCurrency.terminated` field: remove it from the type/schema, delete the 5 currencies it marked (clubcoin, hcash, poswallet, stakenet, stratis), drop the now-unused `withTerminated` parameter from `listCryptoCurrencies`, and clean up the dead code orphaned by those deletions.

- [#18955](https://github.com/LedgerHQ/ledger-live/pull/18955) [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(mobile): add tracking on new send flow part 2

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`e97314e`](https://github.com/LedgerHQ/ledger-live/commit/e97314e0d8201195a91e5eeb0fcde9e2b1dfff76), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/cryptoassets@13.54.0
  - @ledgerhq/types-live@6.114.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/live-currency-format@0.12.0
  - @ledgerhq/types-cryptoassets@7.39.0
  - @ledgerhq/devices@8.17.0
  - @ledgerhq/live-network@2.6.7

## 2.3.0-next.0

### Minor Changes

- [#18630](https://github.com/LedgerHQ/ledger-live/pull/18630) [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - [LWM] feat(mobile): add tracking part 1

- [#19197](https://github.com/LedgerHQ/ledger-live/pull/19197) [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620) Thanks [@lysyi3m](https://github.com/lysyi3m)! - generic-coin-framework: store the account public key in `Account.xpub` (previously the address) for the evm/xrp/stellar/tezos families. Derive `makeSync`'s account-id identity from the immutable account id instead of the mutable `xpub` field, so healing `xpub` to the public key never re-keys or clears accounts. Account ids remain address-based; existing accounts populate `xpub` on the next device-connected scan.

- [#18829](https://github.com/LedgerHQ/ledger-live/pull/18829) [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Sunset the `CryptoCurrency.terminated` field: remove it from the type/schema, delete the 5 currencies it marked (clubcoin, hcash, poswallet, stakenet, stratis), drop the now-unused `withTerminated` parameter from `listCryptoCurrencies`, and clean up the dead code orphaned by those deletions.

- [#18955](https://github.com/LedgerHQ/ledger-live/pull/18955) [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(mobile): add tracking on new send flow part 2

### Patch Changes

- Updated dependencies [[`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`e97314e`](https://github.com/LedgerHQ/ledger-live/commit/e97314e0d8201195a91e5eeb0fcde9e2b1dfff76), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @ledgerhq/cryptoassets@13.54.0-next.0
  - @ledgerhq/types-live@6.114.0-next.0
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/live-currency-format@0.12.0-next.0
  - @ledgerhq/types-cryptoassets@7.39.0-next.0
  - @ledgerhq/devices@8.17.0-next.0
  - @ledgerhq/live-network@2.6.7-next.0

## 2.2.1

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`9bf46c3`](https://github.com/LedgerHQ/ledger-live/commit/9bf46c38e84f6b8caf5bf26ba6afe48a40a01711), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0
  - @ledgerhq/errors@6.37.0
  - @ledgerhq/live-env@2.40.0
  - @ledgerhq/live-currency-format@0.11.0
  - @ledgerhq/cryptoassets@13.53.0
  - @ledgerhq/devices@8.16.0
  - @ledgerhq/live-network@2.6.6

## 2.2.1-next.0

### Patch Changes

- Updated dependencies [[`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc), [`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`9bf46c3`](https://github.com/LedgerHQ/ledger-live/commit/9bf46c38e84f6b8caf5bf26ba6afe48a40a01711), [`b8a0765`](https://github.com/LedgerHQ/ledger-live/commit/b8a0765d7ac1ac1a60456f9c604e7a694e38bd84), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`ebda9d8`](https://github.com/LedgerHQ/ledger-live/commit/ebda9d88805501f4c2c03fef0fe24f116a8a2a6c), [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292), [`37eba10`](https://github.com/LedgerHQ/ledger-live/commit/37eba10db15542fb7859bafac772e6d280650872), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @ledgerhq/types-live@6.113.0-next.0
  - @ledgerhq/errors@6.37.0-next.0
  - @ledgerhq/live-env@2.40.0-next.0
  - @ledgerhq/live-currency-format@0.11.0-next.0
  - @ledgerhq/cryptoassets@13.53.0-next.0
  - @ledgerhq/devices@8.16.0-next.0
  - @ledgerhq/live-network@2.6.6-next.0

## 2.2.0

### Minor Changes

- [#18490](https://github.com/LedgerHQ/ledger-live/pull/18490) [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d) Thanks [@ysitbon](https://github.com/ysitbon)! - Replace the embedded `TokenCurrency.parentCurrency: CryptoCurrency` object with a `parentCurrencyId: string` foreign key.

  `TokenCurrency` no longer carries the full parent `CryptoCurrency` object. Resolve the parent on demand with `getCryptoCurrencyById(token.parentCurrencyId)` (or `findCryptoCurrencyById` when a missing parent must be tolerated). The CAL token converter and persistence layer now read/write `parentCurrencyId` directly, aligning the legacy type with the `@domain/entity-currency-token` schema.

- [#18256](https://github.com/LedgerHQ/ledger-live/pull/18256) [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Derive "supported currencies" from the coin-modules registry instead of `setSupportedCurrencies`.

  Each `CoinModuleLoader` now declares a `supportedCoins: CryptoCurrencyId[]` field, and a currency is supported when it appears in a registered loader's `supportedCoins`. The framework `setSupportedCurrencies` / `listSupportedCurrencies` / `isCurrencySupported` and the `EXPERIMENTAL_CURRENCIES` env are removed; `listSupportedCurrencies` / `isCurrencySupported` are now exported from `@ledgerhq/live-common/currencies` backed by the registry. Apps no longer maintain a supported-currencies list — registering the coin modules is what makes their currencies supported.

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7), [`b9a2a9e`](https://github.com/LedgerHQ/ledger-live/commit/b9a2a9e5b85f9fb5556ef2de83bd0418e5326e89), [`bfbd74d`](https://github.com/LedgerHQ/ledger-live/commit/bfbd74d47f028d7398e1856c7b18442be3f8f6d7), [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855), [`031097a`](https://github.com/LedgerHQ/ledger-live/commit/031097ac469c39e4ab475b92d9f6960ebb9a1ad3), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`82a143f`](https://github.com/LedgerHQ/ledger-live/commit/82a143ff527c4a71e2c9ea79babc473ed395b42d), [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0
  - @ledgerhq/types-live@6.112.0
  - @ledgerhq/cryptoassets@13.52.0
  - @ledgerhq/types-cryptoassets@7.38.0
  - @ledgerhq/live-currency-format@0.10.0
  - @ledgerhq/live-network@2.6.5

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

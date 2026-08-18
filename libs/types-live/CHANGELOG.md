# @ledgerhq/types-live

## 6.120.0-next.1

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

## 6.120.0-next.0

### Minor Changes

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20630](https://github.com/LedgerHQ/ledger-live/pull/20630) [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c) Thanks [@sarneijim](https://github.com/sarneijim)! - Enable LNS upsell portfolio banner for opted-in users (LIVE-32086).

## 6.119.0

### Minor Changes

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20574](https://github.com/LedgerHQ/ledger-live/pull/20574) [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move these packages from `libs/ledgerjs/packages/` up to `libs/`. The remaining LedgerJS packages stay in place until they are extracted to the ts-libs repository.

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

## 6.119.0-next.0

### Minor Changes

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20574](https://github.com/LedgerHQ/ledger-live/pull/20574) [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move these packages from `libs/ledgerjs/packages/` up to `libs/`. The remaining LedgerJS packages stay in place until they are extracted to the ts-libs repository.

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

## 6.118.0

### Minor Changes

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d) Thanks [@sarneijim](https://github.com/sarneijim)! - Use the shared large-screen upsell configuration and eligibility for mobile upgrade banners.

- [#20256](https://github.com/LedgerHQ/ledger-live/pull/20256) [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a) Thanks [@ysitbon](https://github.com/ysitbon)! - Own the currency type declarations internally instead of importing them from the now-deleted `@ledgerhq/types-cryptoassets`.

  `@ledgerhq/types-live` was the last consumer of that package, which it pulled in as a `devDependency` even though the emitted `.d.ts` referenced it — so external consumers had to resolve a phantom dependency to type-check `Account.currency`. The declarations now live in `src/currency.ts`.

  These types are internal: they are not re-exported from the package entry point, and the `./currency` subpath is blocked in `exports`, so they cannot be imported from outside. They are marked `@deprecated` and exist only until the types that carry them move to the domain packages. Use `@domain/entity-currency-crypto`, `@domain/entity-currency-token`, `@domain/entity-currency-unit` and `@domain/entity-currency`.

  The exported type surface is unchanged: `CryptoCurrency`, `TokenCurrency`, `CryptoOrTokenCurrency` and `Unit` keep the exact shapes they had, so every signature that mentions them is structurally identical.

  `FiatCurrency`, `Currency` and `CryptoCurrencyId` were not carried over — nothing in `types-live` used them. Import them from `@domain/entity-currency-fiat`, `@domain/entity-currency` and `@shared/schema-primitives` respectively.

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

## 6.118.0-next.0

### Minor Changes

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d) Thanks [@sarneijim](https://github.com/sarneijim)! - Use the shared large-screen upsell configuration and eligibility for mobile upgrade banners.

- [#20256](https://github.com/LedgerHQ/ledger-live/pull/20256) [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a) Thanks [@ysitbon](https://github.com/ysitbon)! - Own the currency type declarations internally instead of importing them from the now-deleted `@ledgerhq/types-cryptoassets`.

  `@ledgerhq/types-live` was the last consumer of that package, which it pulled in as a `devDependency` even though the emitted `.d.ts` referenced it — so external consumers had to resolve a phantom dependency to type-check `Account.currency`. The declarations now live in `src/currency.ts`.

  These types are internal: they are not re-exported from the package entry point, and the `./currency` subpath is blocked in `exports`, so they cannot be imported from outside. They are marked `@deprecated` and exist only until the types that carry them move to the domain packages. Use `@domain/entity-currency-crypto`, `@domain/entity-currency-token`, `@domain/entity-currency-unit` and `@domain/entity-currency`.

  The exported type surface is unchanged: `CryptoCurrency`, `TokenCurrency`, `CryptoOrTokenCurrency` and `Unit` keep the exact shapes they had, so every signature that mentions them is structurally identical.

  `FiatCurrency`, `Currency` and `CryptoCurrencyId` were not carried over — nothing in `types-live` used them. Import them from `@domain/entity-currency-fiat`, `@domain/entity-currency` and `@shared/schema-primitives` respectively.

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

## 6.117.0

### Minor Changes

- [#20073](https://github.com/LedgerHQ/ledger-live/pull/20073) [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove newsfeedPage feature flag (LIVE-31511)

- [#20054](https://github.com/LedgerHQ/ledger-live/pull/20054) [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove the disabled npsRatingsPrompt feature flag and NPS ratings dead code on mobile

- [#20072](https://github.com/LedgerHQ/ledger-live/pull/20072) [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove deprecated storyly feature flag, types, and orphaned i18n keys.

- [#20114](https://github.com/LedgerHQ/ledger-live/pull/20114) [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa) Thanks [@semeano](https://github.com/semeano)! - Add Ironwood support to Zcash

## 6.117.0-next.0

### Minor Changes

- [#20073](https://github.com/LedgerHQ/ledger-live/pull/20073) [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove newsfeedPage feature flag (LIVE-31511)

- [#20054](https://github.com/LedgerHQ/ledger-live/pull/20054) [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove the disabled npsRatingsPrompt feature flag and NPS ratings dead code on mobile

- [#20072](https://github.com/LedgerHQ/ledger-live/pull/20072) [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove deprecated storyly feature flag, types, and orphaned i18n keys.

- [#20114](https://github.com/LedgerHQ/ledger-live/pull/20114) [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa) Thanks [@semeano](https://github.com/semeano)! - Add Ironwood support to Zcash

## 6.116.0

### Minor Changes

- [#19762](https://github.com/LedgerHQ/ledger-live/pull/19762) [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: limit aleo swaps to public balance only

- [#19738](https://github.com/LedgerHQ/ledger-live/pull/19738) [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): store delegation shares

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#18413](https://github.com/LedgerHQ/ledger-live/pull/18413) [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove lldActionCarousel feature flag (always enabled with variant A)

## 6.116.0-next.0

### Minor Changes

- [#19762](https://github.com/LedgerHQ/ledger-live/pull/19762) [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: limit aleo swaps to public balance only

- [#19738](https://github.com/LedgerHQ/ledger-live/pull/19738) [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): store delegation shares

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#18413](https://github.com/LedgerHQ/ledger-live/pull/18413) [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove lldActionCarousel feature flag (always enabled with variant A)

## 6.115.0

### Minor Changes

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

- [#19333](https://github.com/LedgerHQ/ledger-live/pull/19333) [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Deprecate `preload` and `hydrate` on `CurrencyBridge` interface — both methods are now optional. Prefer loading data lazily in UI flows instead of eagerly via these methods.

- [#19351](https://github.com/LedgerHQ/ledger-live/pull/19351) [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop @ledgerhq/client-ids dep by inlining a DeviceId interface

## 6.115.0-next.0

### Minor Changes

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

- [#19333](https://github.com/LedgerHQ/ledger-live/pull/19333) [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Deprecate `preload` and `hydrate` on `CurrencyBridge` interface — both methods are now optional. Prefer loading data lazily in UI flows instead of eagerly via these methods.

- [#19351](https://github.com/LedgerHQ/ledger-live/pull/19351) [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop @ledgerhq/client-ids dep by inlining a DeviceId interface

## 6.114.0

### Minor Changes

- [#19015](https://github.com/LedgerHQ/ledger-live/pull/19015) [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm ledger sync feature flag clean up

- [#18887](https://github.com/LedgerHQ/ledger-live/pull/18887) [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the `concordiumVerifyAddress` feature flag and its "address verification unavailable" fallback. On-device address verification is now the unconditional path for all Concordium accounts.

- [#19184](https://github.com/LedgerHQ/ledger-live/pull/19184) [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Promote the EVM edit-transaction (speed-up / cancel) helpers to the bridge contract.

  `AccountBridgeExtensions` is now generic over the transaction type and exposes the app-facing edit-transaction methods (`getEditTransactionPatch`, `getEditTransactionStatus`, `getFormattedFeeFields`, `hasMinimumFundsToCancel`, `hasMinimumFundsToSpeedUp`, `isStrategyDisabled`, `isTransactionConfirmed`). The implementations move out of `@ledgerhq/coin-evm` into `ledger-live-common` (`families/evm`), and every app/LLC call site now reaches them through `getAccountBridge(account)` instead of importing `@ledgerhq/coin-evm/editTransaction/*`. The contract uses only base types so other families (e.g. Bitcoin RBF) can implement the same surface later.

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#18953](https://github.com/LedgerHQ/ledger-live/pull/18953) [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - opt-in notification feature flag clean up

- [#18936](https://github.com/LedgerHQ/ledger-live/pull/18936) [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - lldRebordABTest feature flag clean up

- [#19187](https://github.com/LedgerHQ/ledger-live/pull/19187) [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e) Thanks [@sarneijim](https://github.com/sarneijim)! - Persist onboardingDate in the shared post-onboarding store to power the post-onboarding upsell cooldown. It is preserved when reopening or hiding the wallet entry point for the same device, refreshed when a different device is onboarded, and backfilled to today once for legacy users on first launch.

- [#18891](https://github.com/LedgerHQ/ledger-live/pull/18891) [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - flexibleContentCards feature flag cleanup

- [#18962](https://github.com/LedgerHQ/ledger-live/pull/18962) [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove llmRebornABtest feature flag and legacy NoLedgerYetModal onboarding path

- [#18855](https://github.com/LedgerHQ/ledger-live/pull/18855) [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the `llmRebornLP` feature flag (always enabled with variant A) and inline the enabled behavior

- [#18971](https://github.com/LedgerHQ/ledger-live/pull/18971) [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the always-enabled `nanoOnboardingFundWallet` feature flag and clean up the dead onboarding tutorial code it gated (the `Aside` illustration sidebar, per-screen `Illustration`/`Footer` statics, related shared helpers, and orphaned i18n keys).

- [#18993](https://github.com/LedgerHQ/ledger-live/pull/18993) [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwd sync onboarding feature flag clean up

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.11.1

## 6.114.0-next.0

### Minor Changes

- [#19015](https://github.com/LedgerHQ/ledger-live/pull/19015) [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm ledger sync feature flag clean up

- [#18887](https://github.com/LedgerHQ/ledger-live/pull/18887) [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the `concordiumVerifyAddress` feature flag and its "address verification unavailable" fallback. On-device address verification is now the unconditional path for all Concordium accounts.

- [#19184](https://github.com/LedgerHQ/ledger-live/pull/19184) [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Promote the EVM edit-transaction (speed-up / cancel) helpers to the bridge contract.

  `AccountBridgeExtensions` is now generic over the transaction type and exposes the app-facing edit-transaction methods (`getEditTransactionPatch`, `getEditTransactionStatus`, `getFormattedFeeFields`, `hasMinimumFundsToCancel`, `hasMinimumFundsToSpeedUp`, `isStrategyDisabled`, `isTransactionConfirmed`). The implementations move out of `@ledgerhq/coin-evm` into `ledger-live-common` (`families/evm`), and every app/LLC call site now reaches them through `getAccountBridge(account)` instead of importing `@ledgerhq/coin-evm/editTransaction/*`. The contract uses only base types so other families (e.g. Bitcoin RBF) can implement the same surface later.

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#18953](https://github.com/LedgerHQ/ledger-live/pull/18953) [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - opt-in notification feature flag clean up

- [#18936](https://github.com/LedgerHQ/ledger-live/pull/18936) [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - lldRebordABTest feature flag clean up

- [#19187](https://github.com/LedgerHQ/ledger-live/pull/19187) [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e) Thanks [@sarneijim](https://github.com/sarneijim)! - Persist onboardingDate in the shared post-onboarding store to power the post-onboarding upsell cooldown. It is preserved when reopening or hiding the wallet entry point for the same device, refreshed when a different device is onboarded, and backfilled to today once for legacy users on first launch.

- [#18891](https://github.com/LedgerHQ/ledger-live/pull/18891) [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - flexibleContentCards feature flag cleanup

- [#18962](https://github.com/LedgerHQ/ledger-live/pull/18962) [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove llmRebornABtest feature flag and legacy NoLedgerYetModal onboarding path

- [#18855](https://github.com/LedgerHQ/ledger-live/pull/18855) [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the `llmRebornLP` feature flag (always enabled with variant A) and inline the enabled behavior

- [#18971](https://github.com/LedgerHQ/ledger-live/pull/18971) [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the always-enabled `nanoOnboardingFundWallet` feature flag and clean up the dead onboarding tutorial code it gated (the `Aside` illustration sidebar, per-screen `Illustration`/`Footer` statics, related shared helpers, and orphaned i18n keys).

- [#18993](https://github.com/LedgerHQ/ledger-live/pull/18993) [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwd sync onboarding feature flag clean up

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.11.1-next.0

## 6.113.0

### Minor Changes

- [#18478](https://github.com/LedgerHQ/ledger-live/pull/18478) [`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc) Thanks [@henri-ly](https://github.com/henri-ly)! - Add withdraw flow for Monad EVM staking

- [#18681](https://github.com/LedgerHQ/ledger-live/pull/18681) [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove llmAnalyticsOptInPrompt feature flag and unused variant B code

- [#18660](https://github.com/LedgerHQ/ledger-live/pull/18660) [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove "llmHomescreen" feature flag and legacy code in lwm

- [#18572](https://github.com/LedgerHQ/ledger-live/pull/18572) [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

- [#18604](https://github.com/LedgerHQ/ledger-live/pull/18604) [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add foundation for the image-based Q2 Wallet V4 Tour: new `q2Tour` parameter on the `lwmWallet40` feature flag and a persisted `hasSeenQ2WalletV4Tour` mobile settings flag

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

- [#18011](https://github.com/LedgerHQ/ledger-live/pull/18011) [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8) Thanks [@hhumphrey-ledger](https://github.com/hhumphrey-ledger)! - Forward on the currencyId to the earn deposit screen to support the swap to earn feature

### Patch Changes

- Updated dependencies [[`7817aff`](https://github.com/LedgerHQ/ledger-live/commit/7817aff12e1a26fbfbe70176afa6811d7020087d)]:
  - @ledgerhq/client-ids@0.11.0

## 6.113.0-next.0

### Minor Changes

- [#18478](https://github.com/LedgerHQ/ledger-live/pull/18478) [`636a4cb`](https://github.com/LedgerHQ/ledger-live/commit/636a4cbc5ae01364af425e3837cecf1ce4d3f3bc) Thanks [@henri-ly](https://github.com/henri-ly)! - Add withdraw flow for Monad EVM staking

- [#18681](https://github.com/LedgerHQ/ledger-live/pull/18681) [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove llmAnalyticsOptInPrompt feature flag and unused variant B code

- [#18660](https://github.com/LedgerHQ/ledger-live/pull/18660) [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove "llmHomescreen" feature flag and legacy code in lwm

- [#18572](https://github.com/LedgerHQ/ledger-live/pull/18572) [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

- [#18604](https://github.com/LedgerHQ/ledger-live/pull/18604) [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add foundation for the image-based Q2 Wallet V4 Tour: new `q2Tour` parameter on the `lwmWallet40` feature flag and a persisted `hasSeenQ2WalletV4Tour` mobile settings flag

- [#18520](https://github.com/LedgerHQ/ledger-live/pull/18520) [`4ace552`](https://github.com/LedgerHQ/ledger-live/commit/4ace55213a4f1869980aab5160683bb120c65292) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.

- [#18011](https://github.com/LedgerHQ/ledger-live/pull/18011) [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8) Thanks [@hhumphrey-ledger](https://github.com/hhumphrey-ledger)! - Forward on the currencyId to the earn deposit screen to support the swap to earn feature

### Patch Changes

- Updated dependencies [[`7817aff`](https://github.com/LedgerHQ/ledger-live/commit/7817aff12e1a26fbfbe70176afa6811d7020087d)]:
  - @ledgerhq/client-ids@0.11.0-next.0

## 6.112.0

### Minor Changes

- [#18222](https://github.com/LedgerHQ/ledger-live/pull/18222) [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7) Thanks [@henri-ly](https://github.com/henri-ly)! - add undelegate for monad

- [#18386](https://github.com/LedgerHQ/ledger-live/pull/18386) [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855) Thanks [@ysitbon](https://github.com/ysitbon)! - Deprecate the legacy feature-flag types in `feature.ts` (`Feature`, `Features`, `FeatureId`, `FeatureMap`, `OptionalFeatureMap`, `FeatureParam`, and all `Feature_*`). The Ledger Live feature-flag registry has moved to `@shared/feature-flags`; every export now carries a `@deprecated` annotation pointing to its replacement (e.g. `Feature_Noah` → `Features["noah"]`). The types stay exported for backward compatibility and are slated for removal in a future major.

- [#18642](https://github.com/LedgerHQ/ledger-live/pull/18642) [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

- [#18298](https://github.com/LedgerHQ/ledger-live/pull/18298) [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Extract `quickActionsCtasVariant` out of the `feature_lwm_wallet_40` feature flag into a dedicated `feature_lwm_quick_actions_ctas_variant` flag so the A/B test can run independently from other Wallet 4.0 parameters

- [#17997](https://github.com/LedgerHQ/ledger-live/pull/17997) [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356) Thanks [@Justkant](https://github.com/Justkant)! - Harden custom deeplink opening behind platform feature flags.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.3

## 6.112.0-next.1

### Minor Changes

- [#18642](https://github.com/LedgerHQ/ledger-live/pull/18642) [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

## 6.112.0-next.0

### Minor Changes

- [#18222](https://github.com/LedgerHQ/ledger-live/pull/18222) [`9ddf006`](https://github.com/LedgerHQ/ledger-live/commit/9ddf006bc2897a2393f1a9595b3c6a43d0c35bf7) Thanks [@henri-ly](https://github.com/henri-ly)! - add undelegate for monad

- [#18386](https://github.com/LedgerHQ/ledger-live/pull/18386) [`da1c0c8`](https://github.com/LedgerHQ/ledger-live/commit/da1c0c87b3d2540eff9e51c665df8192b4486855) Thanks [@ysitbon](https://github.com/ysitbon)! - Deprecate the legacy feature-flag types in `feature.ts` (`Feature`, `Features`, `FeatureId`, `FeatureMap`, `OptionalFeatureMap`, `FeatureParam`, and all `Feature_*`). The Ledger Live feature-flag registry has moved to `@shared/feature-flags`; every export now carries a `@deprecated` annotation pointing to its replacement (e.g. `Feature_Noah` → `Features["noah"]`). The types stay exported for backward compatibility and are slated for removal in a future major.

- [#18298](https://github.com/LedgerHQ/ledger-live/pull/18298) [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Extract `quickActionsCtasVariant` out of the `feature_lwm_wallet_40` feature flag into a dedicated `feature_lwm_quick_actions_ctas_variant` flag so the A/B test can run independently from other Wallet 4.0 parameters

- [#17997](https://github.com/LedgerHQ/ledger-live/pull/17997) [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356) Thanks [@Justkant](https://github.com/Justkant)! - Harden custom deeplink opening behind platform feature flags.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.3-next.0

## 6.111.0

### Minor Changes

- [#18027](https://github.com/LedgerHQ/ledger-live/pull/18027) [`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add notification drawer prompt target contracts

- [#17907](https://github.com/LedgerHQ/ledger-live/pull/17907) [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b) Thanks [@deepyjr](https://github.com/deepyjr)! - Add assetDiscoverability param to lwmWallet40 and expose shouldDisplayAssetDiscoverability in usePortfolioViewModel and MainAppLayout

- [#18204](https://github.com/LedgerHQ/ledger-live/pull/18204) [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add `lwmBackupHub` / `lwdBackupHub` Engagement feature flags (default disabled) for the Recover Backup Hub initiative, and reserve CODEOWNERS ownership of the upcoming BackupHub MVVM folders.

- [#17990](https://github.com/LedgerHQ/ledger-live/pull/17990) [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b) Thanks [@sarneijim](https://github.com/sarneijim)! - Extract onboarding widget control from `lwdWallet40` into a standalone `onboardingWidget` feature flag.

- [#17927](https://github.com/LedgerHQ/ledger-live/pull/17927) [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): represent validator token as string

- [#18163](https://github.com/LedgerHQ/ledger-live/pull/18163) [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78) Thanks [@vcluzeau-ledger](https://github.com/vcluzeau-ledger)! - Make Recover URI templating actually replace `protectId`, drop unused `protectServicesDesktop` / `protectServicesMobile` params, and replace `compatibleDevices` with a hardcoded Nano S exclusion in `isRecoverDisplayed`.

  `useReplacedURI` previously only rewrote the placeholders `protect-simu`, `protect-local-dev` and `protect-staging`, so any URI hard-coded with `protect-prod` (e.g. the values shipped to PROD via Firebase Remote Config) was never re-templated when `protectId` changed. Switching the active Recover environment therefore required a manual find-and-replace across every URI in the feature flag. The regex now matches any `protect-<env>` segment, which is a no-op when `protectId` already equals that segment and a true substitution otherwise.

  `compatibleDevices` is replaced by a hardcoded check in `isRecoverDisplayed` — Nano S is the only device that does not support Recover and the rule is not expected to change. Dropping the array from the schema keeps the FF lean and removes the need to update Remote Config when a new device is supported.

  Also remove keys that have no consumer in either app — `isNew`, `ledgerliveStorageState`, `onboardingCompleted.alreadySubscribedURI`, and the entire `onboardingRestore` block on desktop; `ledgerliveStorageState`, `restoreInfoDrawer.manualStepsURI`, `managerStatesData.NEW.learnMoreURI` and `managerStatesData.NEW.alreadySubscribedURI` on mobile. `usePostOnboardingURI` is narrowed to `Feature_ProtectServicesMobile` since it is only called from the mobile app. Unknown keys still in Firebase are silently stripped by Zod, so this is forward-compatible with existing Remote Config payloads.

- [#18064](https://github.com/LedgerHQ/ledger-live/pull/18064) [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Split EVM staking operations into per-chain modules and thread an optional validator id (`valId`) through the staking transaction/intent so chains that key operations by a numeric id (e.g. Monad) are supported alongside address-keyed chains (Sei, Celo)

- [#18229](https://github.com/LedgerHQ/ledger-live/pull/18229) [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): fetch missing validator names

- [#17932](https://github.com/LedgerHQ/ledger-live/pull/17932) [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Add `earnUpselling` and `earnSimulator` as Wallet 4.0 feature flag params, expose them in the Wallet 4.0 analytics attributes, and surface them in the desktop and mobile developer settings toggles.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.2

## 6.111.0-next.0

### Minor Changes

- [#18027](https://github.com/LedgerHQ/ledger-live/pull/18027) [`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add notification drawer prompt target contracts

- [#17907](https://github.com/LedgerHQ/ledger-live/pull/17907) [`9901502`](https://github.com/LedgerHQ/ledger-live/commit/990150200e70bc3ea55c5cfc41e1c77f24cc315b) Thanks [@deepyjr](https://github.com/deepyjr)! - Add assetDiscoverability param to lwmWallet40 and expose shouldDisplayAssetDiscoverability in usePortfolioViewModel and MainAppLayout

- [#18204](https://github.com/LedgerHQ/ledger-live/pull/18204) [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add `lwmBackupHub` / `lwdBackupHub` Engagement feature flags (default disabled) for the Recover Backup Hub initiative, and reserve CODEOWNERS ownership of the upcoming BackupHub MVVM folders.

- [#17990](https://github.com/LedgerHQ/ledger-live/pull/17990) [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b) Thanks [@sarneijim](https://github.com/sarneijim)! - Extract onboarding widget control from `lwdWallet40` into a standalone `onboardingWidget` feature flag.

- [#17927](https://github.com/LedgerHQ/ledger-live/pull/17927) [`d19f9de`](https://github.com/LedgerHQ/ledger-live/commit/d19f9debb00e15edbaa7d2cedfcb0d2b5ced4f80) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): represent validator token as string

- [#18163](https://github.com/LedgerHQ/ledger-live/pull/18163) [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78) Thanks [@vcluzeau-ledger](https://github.com/vcluzeau-ledger)! - Make Recover URI templating actually replace `protectId`, drop unused `protectServicesDesktop` / `protectServicesMobile` params, and replace `compatibleDevices` with a hardcoded Nano S exclusion in `isRecoverDisplayed`.

  `useReplacedURI` previously only rewrote the placeholders `protect-simu`, `protect-local-dev` and `protect-staging`, so any URI hard-coded with `protect-prod` (e.g. the values shipped to PROD via Firebase Remote Config) was never re-templated when `protectId` changed. Switching the active Recover environment therefore required a manual find-and-replace across every URI in the feature flag. The regex now matches any `protect-<env>` segment, which is a no-op when `protectId` already equals that segment and a true substitution otherwise.

  `compatibleDevices` is replaced by a hardcoded check in `isRecoverDisplayed` — Nano S is the only device that does not support Recover and the rule is not expected to change. Dropping the array from the schema keeps the FF lean and removes the need to update Remote Config when a new device is supported.

  Also remove keys that have no consumer in either app — `isNew`, `ledgerliveStorageState`, `onboardingCompleted.alreadySubscribedURI`, and the entire `onboardingRestore` block on desktop; `ledgerliveStorageState`, `restoreInfoDrawer.manualStepsURI`, `managerStatesData.NEW.learnMoreURI` and `managerStatesData.NEW.alreadySubscribedURI` on mobile. `usePostOnboardingURI` is narrowed to `Feature_ProtectServicesMobile` since it is only called from the mobile app. Unknown keys still in Firebase are silently stripped by Zod, so this is forward-compatible with existing Remote Config payloads.

- [#18064](https://github.com/LedgerHQ/ledger-live/pull/18064) [`cc4dd4d`](https://github.com/LedgerHQ/ledger-live/commit/cc4dd4db5e312da55966a6f0a8daa90e75e4dd94) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Split EVM staking operations into per-chain modules and thread an optional validator id (`valId`) through the staking transaction/intent so chains that key operations by a numeric id (e.g. Monad) are supported alongside address-keyed chains (Sei, Celo)

- [#18229](https://github.com/LedgerHQ/ledger-live/pull/18229) [`bbc72fe`](https://github.com/LedgerHQ/ledger-live/commit/bbc72fe2ad0cee010349ab3b2e5a1e369dd9e840) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): fetch missing validator names

- [#17932](https://github.com/LedgerHQ/ledger-live/pull/17932) [`5842a85`](https://github.com/LedgerHQ/ledger-live/commit/5842a85907c7418a393b0dffee756bff52370024) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Add `earnUpselling` and `earnSimulator` as Wallet 4.0 feature flag params, expose them in the Wallet 4.0 analytics attributes, and surface them in the desktop and mobile developer settings toggles.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.2-next.0

## 6.110.0

### Minor Changes

- [#17897](https://github.com/LedgerHQ/ledger-live/pull/17897) [`812538e`](https://github.com/LedgerHQ/ledger-live/commit/812538e1788cf63aa3166d3842f0b27248400690) Thanks [@sarneijim](https://github.com/sarneijim)! - Extract onboarding widget control from `lwmWallet40` into a standalone `onboardingWidget` feature flag.

- [#17648](https://github.com/LedgerHQ/ledger-live/pull/17648) [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Arc and Arc Testnet (Circle's USDC-native EVM L1, chainIds 5042 and 5042002)

- [#17837](https://github.com/LedgerHQ/ledger-live/pull/17837) [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm - lwd feature flag for counterfeit warning

- [#17630](https://github.com/LedgerHQ/ledger-live/pull/17630) [`5e2b764`](https://github.com/LedgerHQ/ledger-live/commit/5e2b76429c0b3024782dc179875a24c5f2655274) Thanks [@sarneijim](https://github.com/sarneijim)! - Add post-onboarding `discoverWallet` action that opens the LWM Product Tour (`tickProductTourDeeplink` + navigate to Portfolio), aligned with `ProductTourPortfolioMount` / `ledgerlive://product-tour`.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/client-ids@0.10.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

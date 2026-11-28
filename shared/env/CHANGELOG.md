# @shared/env

## 0.14.0

### Minor Changes

- [#24711](https://github.com/LedgerHQ/ledger-live/pull/24711) [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927) Thanks [@LL782](https://github.com/LL782)! - Remove the `llmMmkvMigration` flag, the storage rollback state and the storage performance overlay. The AsyncStorage to MMKV migration still runs from the Portfolio screen

## 0.14.0-next.0

### Minor Changes

- [#24711](https://github.com/LedgerHQ/ledger-live/pull/24711) [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927) Thanks [@LL782](https://github.com/LL782)! - Remove the `llmMmkvMigration` flag, the storage rollback state and the storage performance overlay. The AsyncStorage to MMKV migration still runs from the Portfolio screen

## 0.13.0

### Minor Changes

- [#24457](https://github.com/LedgerHQ/ledger-live/pull/24457) [`420409b`](https://github.com/LedgerHQ/ledger-live/commit/420409ba20ed5eca81813b15b7dcb85a92de1b5b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Read the Cardano API and epoch-params endpoints from the coin config (`api.url`, `epochParams.url`) instead of the `CARDANO_*_ENDPOINT` env variables, which are removed

  **Breaking change**: `CardanoConfig` gains the required `api: { url: string }` and `epochParams: { url: string }`, and `CARDANO_API_ENDPOINT`, `CARDANO_TESTNET_API_ENDPOINT`, `CARDANO_EPOCH_PARAMS_ENDPOINT` and `CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT` are no longer exported from `src/constants`. Each currency config carries its own endpoints, so a consumer that builds its own config (such as the coin-service) passes them there; `cardanoDefaults` holds the Ledger defaults.

- [#24271](https://github.com/LedgerHQ/ledger-live/pull/24271) [`ef95b2e`](https://github.com/LedgerHQ/ledger-live/commit/ef95b2e00e490f024b81bfbf35cb582b5fed8783) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the CoinGecko market client and keep the USD chart fallback

## 0.13.0-next.0

### Minor Changes

- [#24457](https://github.com/LedgerHQ/ledger-live/pull/24457) [`420409b`](https://github.com/LedgerHQ/ledger-live/commit/420409ba20ed5eca81813b15b7dcb85a92de1b5b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Read the Cardano API and epoch-params endpoints from the coin config (`api.url`, `epochParams.url`) instead of the `CARDANO_*_ENDPOINT` env variables, which are removed

  **Breaking change**: `CardanoConfig` gains the required `api: { url: string }` and `epochParams: { url: string }`, and `CARDANO_API_ENDPOINT`, `CARDANO_TESTNET_API_ENDPOINT`, `CARDANO_EPOCH_PARAMS_ENDPOINT` and `CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT` are no longer exported from `src/constants`. Each currency config carries its own endpoints, so a consumer that builds its own config (such as the coin-service) passes them there; `cardanoDefaults` holds the Ledger defaults.

- [#24271](https://github.com/LedgerHQ/ledger-live/pull/24271) [`ef95b2e`](https://github.com/LedgerHQ/ledger-live/commit/ef95b2e00e490f024b81bfbf35cb582b5fed8783) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the CoinGecko market client and keep the USD chart fallback

## 0.12.0

### Minor Changes

- [#23736](https://github.com/LedgerHQ/ledger-live/pull/23736) [`797b1ab`](https://github.com/LedgerHQ/ledger-live/commit/797b1ab63e4099c962a74170b43275f149c6fbea) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-solana): read endpoints and tuning values from the coin config

  `rpcUrls` is now a required field of `SolanaCoinConfig` and `endpointByCurrencyId` resolves the
  endpoint of a currency from `rpcUrls[<currencyId>]` alone: the `API_SOLANA_PROXY` env and the
  web3.js `clusterApiUrl` fallbacks are removed, and a missing entry throws. live-common registers
  `config_currency_solana_devnet` and `config_currency_solana_testnet` next to
  `config_currency_solana`, each carrying its own endpoint, and the legacy coin config resolves the
  configuration of the requested currency instead of always reading the mainnet one.

  The legacy validators list is read from `validatorsUrl` of the requested currency, the field the
  Alpaca `getValidators` already reads: `config_currency_solana` defaults to the production Earn API
  list (`/v0/network/solana/validator-details`) and `config_currency_solana_testnet` to the
  `validators-solana` testnet list. `solana_devnet` still derives its validators from the RPC vote
  accounts. A missing `validatorsUrl` on mainnet or testnet throws.

  The validator APY is read from `staking.validatorsSummaryUrl` (default in `config_currency_solana`:
  the production Figment summary on the Earn API) in both the legacy and the Alpaca paths, at call
  time instead of once at module load. A currency without it lists its validators without APY, so
  `solana_testnet` no longer fetches the mainnet APY through the Alpaca API.

  The tuning values are read from the coin config at call time, each falling back to one exported
  module default in `constants`: `broadcast.timeoutMs` (`DEFAULT_BROADCAST_TIMEOUT_MS`, 100000),
  `node.retries` / `node.retryDelayMs` (`DEFAULT_NODE_RETRIES` 3, `DEFAULT_NODE_RETRY_DELAY_MS` 500),
  `node.maxTxQuery` / `node.batchSize` (100 / 100), `fees.computeUnitMargin` (0.1),
  `fees.defaultTxFee` (5000, also replacing the `?? 5000` copies in `craftTransaction`),
  `fees.blockhashRetries` / `fees.blockhashRetryDelayMs` (5 / 5000), `staking.ledgerValidators`
  (`DEFAULT_LEDGER_VALIDATORS`) and `validators.cacheTtlMs` (`DEFAULT_VALIDATORS_CACHE_TTL_MS`,
  900000). The ky HTTP retry on status codes stays a constant.

  The module keeps no configuration state: `config.ts` holds types only and every reader resolves
  `config_currency_<id>` through a `SolanaContext` at call time. live-common builds it with
  `buildContext` for the message signer and the validators hook.

  Breaking: the `API_SOLANA_PROXY`, `SOLANA_VALIDATORS_APP_BASE_URL`,
  `SOLANA_TESTNET_VALIDATORS_APP_BASE_URL`, `SOLANA_VALIDATORS_SUMMARY_BASE_URL` and
  `SOLANA_TX_CONFIRMATION_TIMEOUT` env definitions are removed; override `rpcUrls.<id>`, `validatorsUrl` and `staking.validatorsSummaryUrl` in
  `config_currency_<id>` instead. The legacy `getValidators` of `network/validator-app` now takes
  `(validatorsUrl, validatorsSummaryUrl?)` instead of a cluster, and the Alpaca `getValidators` takes
  the summary URL as its second argument. `craftTransaction`, `estimateFees`, `estimateTxFee`,
  `unstakeReserve`, `computeUnstakeReserve`, `getBalance` and `listOperations` take the
  `SolanaCoinConfig` as their second argument, `buildVersionedTransaction` as its fourth, and the
  `network/chain/web3` instruction builders take the resolved `computeUnitMargin`.
  `getChainAPI` accepts `confirmationTimeoutMs`, `retries` and `retryDelayMs`; build its config with
  `chainConfigFrom(config, currencyId)`. `LEDGER_VALIDATOR_DEFAULT`, `LEDGER_VALIDATOR_LIST` and
  `LEDGER_VALIDATORS_VOTE_ACCOUNTS` are removed: use `ledgerValidatorsOf(config)` /
  `defaultLedgerValidatorOf(config)`; `LEDGER_VALIDATOR_BY_FIGMENT` / `_BY_BITWISE` moved to
  `constants`. `ledgerFirstValidators` takes the Ledger list as its second argument. The `coinConfig` default export of `config` (`setCoinConfig` / `getCoinConfig`) is removed:
  `getSolanaValidators(context, currencyId)` and `fetchValidators(config, currencyId)` take the
  config explicitly, and `signMessage(signerContext, contextOf)` resolves the account's currency
  context when signing.

## 0.12.0-next.0

### Minor Changes

- [#23736](https://github.com/LedgerHQ/ledger-live/pull/23736) [`797b1ab`](https://github.com/LedgerHQ/ledger-live/commit/797b1ab63e4099c962a74170b43275f149c6fbea) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-solana): read endpoints and tuning values from the coin config

  `rpcUrls` is now a required field of `SolanaCoinConfig` and `endpointByCurrencyId` resolves the
  endpoint of a currency from `rpcUrls[<currencyId>]` alone: the `API_SOLANA_PROXY` env and the
  web3.js `clusterApiUrl` fallbacks are removed, and a missing entry throws. live-common registers
  `config_currency_solana_devnet` and `config_currency_solana_testnet` next to
  `config_currency_solana`, each carrying its own endpoint, and the legacy coin config resolves the
  configuration of the requested currency instead of always reading the mainnet one.

  The legacy validators list is read from `validatorsUrl` of the requested currency, the field the
  Alpaca `getValidators` already reads: `config_currency_solana` defaults to the production Earn API
  list (`/v0/network/solana/validator-details`) and `config_currency_solana_testnet` to the
  `validators-solana` testnet list. `solana_devnet` still derives its validators from the RPC vote
  accounts. A missing `validatorsUrl` on mainnet or testnet throws.

  The validator APY is read from `staking.validatorsSummaryUrl` (default in `config_currency_solana`:
  the production Figment summary on the Earn API) in both the legacy and the Alpaca paths, at call
  time instead of once at module load. A currency without it lists its validators without APY, so
  `solana_testnet` no longer fetches the mainnet APY through the Alpaca API.

  The tuning values are read from the coin config at call time, each falling back to one exported
  module default in `constants`: `broadcast.timeoutMs` (`DEFAULT_BROADCAST_TIMEOUT_MS`, 100000),
  `node.retries` / `node.retryDelayMs` (`DEFAULT_NODE_RETRIES` 3, `DEFAULT_NODE_RETRY_DELAY_MS` 500),
  `node.maxTxQuery` / `node.batchSize` (100 / 100), `fees.computeUnitMargin` (0.1),
  `fees.defaultTxFee` (5000, also replacing the `?? 5000` copies in `craftTransaction`),
  `fees.blockhashRetries` / `fees.blockhashRetryDelayMs` (5 / 5000), `staking.ledgerValidators`
  (`DEFAULT_LEDGER_VALIDATORS`) and `validators.cacheTtlMs` (`DEFAULT_VALIDATORS_CACHE_TTL_MS`,
  900000). The ky HTTP retry on status codes stays a constant.

  The module keeps no configuration state: `config.ts` holds types only and every reader resolves
  `config_currency_<id>` through a `SolanaContext` at call time. live-common builds it with
  `buildContext` for the message signer and the validators hook.

  Breaking: the `API_SOLANA_PROXY`, `SOLANA_VALIDATORS_APP_BASE_URL`,
  `SOLANA_TESTNET_VALIDATORS_APP_BASE_URL`, `SOLANA_VALIDATORS_SUMMARY_BASE_URL` and
  `SOLANA_TX_CONFIRMATION_TIMEOUT` env definitions are removed; override `rpcUrls.<id>`, `validatorsUrl` and `staking.validatorsSummaryUrl` in
  `config_currency_<id>` instead. The legacy `getValidators` of `network/validator-app` now takes
  `(validatorsUrl, validatorsSummaryUrl?)` instead of a cluster, and the Alpaca `getValidators` takes
  the summary URL as its second argument. `craftTransaction`, `estimateFees`, `estimateTxFee`,
  `unstakeReserve`, `computeUnstakeReserve`, `getBalance` and `listOperations` take the
  `SolanaCoinConfig` as their second argument, `buildVersionedTransaction` as its fourth, and the
  `network/chain/web3` instruction builders take the resolved `computeUnitMargin`.
  `getChainAPI` accepts `confirmationTimeoutMs`, `retries` and `retryDelayMs`; build its config with
  `chainConfigFrom(config, currencyId)`. `LEDGER_VALIDATOR_DEFAULT`, `LEDGER_VALIDATOR_LIST` and
  `LEDGER_VALIDATORS_VOTE_ACCOUNTS` are removed: use `ledgerValidatorsOf(config)` /
  `defaultLedgerValidatorOf(config)`; `LEDGER_VALIDATOR_BY_FIGMENT` / `_BY_BITWISE` moved to
  `constants`. `ledgerFirstValidators` takes the Ledger list as its second argument. The `coinConfig` default export of `config` (`setCoinConfig` / `getCoinConfig`) is removed:
  `getSolanaValidators(context, currencyId)` and `fetchValidators(config, currencyId)` take the
  config explicitly, and `signMessage(signerContext, contextOf)` resolves the account's currency
  context when signing.

## 0.11.0

### Minor Changes

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

- [#23315](https://github.com/LedgerHQ/ledger-live/pull/23315) [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fetch LargeMover chart and market rows through RTK Query by ledger id, and drop the unused CoinGecko mapping client.

## 0.11.0-next.0

### Minor Changes

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

- [#23315](https://github.com/LedgerHQ/ledger-live/pull/23315) [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fetch LargeMover chart and market rows through RTK Query by ledger id, and drop the unused CoinGecko mapping client.

## 0.10.0

### Minor Changes

- [#22759](https://github.com/LedgerHQ/ledger-live/pull/22759) [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): read the explorer and tuning values from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and every bridge method resolves `config_currency_<id>` from `context.config()` at call
  time. The endpoint `explorer.url` is required and defaults to today's production host in each
  served `config_currency_<id>` (`http://localhost:9876` for `bitcoin_regtest`, whose `btc_regtest`
  explorer id also moves to its config). The optional fields fall back to named module defaults:
  `explorer.batchSize` (`DEFAULT_EXPLORER_BATCH_SIZE`, 1000), `fees.stuckTransactionTimeoutMs`
  (`DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS`, 20 min), `fees.rbfMinBumpRatio`
  (`DEFAULT_RBF_MIN_BUMP_RATIO`, 0.1), `fees.calculationCacheTtlMs` and `fees.feeRatesCacheTtlMs`
  (5 min each) and `sync.replacedOperationExpiryMs` (`DEFAULT_REPLACED_OPERATION_EXPIRY_MS`, 2 h).
  The explorer is bound to a wallet-btc account from the config at use, so deserialization stays
  config-free and a remote change applies on the next call. wallet-btc still reads no configuration:
  the batch size is injected through `WalletBtcCurrency.explorerBatchSize`, and the RBF ratio and
  the unconfirmed-operation expiry are parameters.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `CoinConfig`, `BitcoinConfigInfo`, `makeAssignFromAccountRaw`
  and `getMinRelayFee` are removed in favour of `BitcoinCoinConfig` / `BitcoinContext` and
  `assignFromAccountRaw`, and `postSync` becomes `makePostSync(context)`. The module logs only
  through `context.logger`: `buildTransaction`, `getTransactionStatus`, `prepareTransaction`,
  `calculateFees`, `signAccountTx`, `ChainAdapter.resolveFeePerByte`, `buildSignRawOperation` and the
  `hw-getAddress` / `hw-getFullViewingKey` resolvers take a `Logger`. `prepareTransaction`, `getTransactionStatus`, `buildTransaction`,
  `buildAccountTx`, `getOriginalTxFeeContext`, `getMinReplacementFeeSat`,
  `getMinReplacementFeeRateSatVb` and `getRbfContext` take the coin config as first parameter. The
  `getEditTransactionStatus` and `isStrategyDisabled` bridge extensions require the `mainAccount`. The `EXPLORER_REGTEST` and `BITCOIN_STUCK_TRANSACTION_TIMEOUT` envs are
  removed, as are the `config_currency_<id>` defaults of the bitcoin-family currencies no loader
  serves (`bitcoin_private`, `game_credits`, `gochain`, `lbry`, `nix`, `ravencoin`, `resistance`,
  `zclassic`, `zcoin`).

- [#22857](https://github.com/LedgerHQ/ledger-live/pull/22857) [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-module-boilerplate): read coin config from the context and drop live-env

- [#22858](https://github.com/LedgerHQ/ledger-live/pull/22858) [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Make coin-polkadot stateless: `createBridges` takes a `Context`, endpoints, tuning and cache TTLs come from `config_currency_polkadot`, logs go through `context.logger`, and the Polkadot env variables are removed.

## 0.10.0-next.0

### Minor Changes

- [#22759](https://github.com/LedgerHQ/ledger-live/pull/22759) [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): read the explorer and tuning values from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and every bridge method resolves `config_currency_<id>` from `context.config()` at call
  time. The endpoint `explorer.url` is required and defaults to today's production host in each
  served `config_currency_<id>` (`http://localhost:9876` for `bitcoin_regtest`, whose `btc_regtest`
  explorer id also moves to its config). The optional fields fall back to named module defaults:
  `explorer.batchSize` (`DEFAULT_EXPLORER_BATCH_SIZE`, 1000), `fees.stuckTransactionTimeoutMs`
  (`DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS`, 20 min), `fees.rbfMinBumpRatio`
  (`DEFAULT_RBF_MIN_BUMP_RATIO`, 0.1), `fees.calculationCacheTtlMs` and `fees.feeRatesCacheTtlMs`
  (5 min each) and `sync.replacedOperationExpiryMs` (`DEFAULT_REPLACED_OPERATION_EXPIRY_MS`, 2 h).
  The explorer is bound to a wallet-btc account from the config at use, so deserialization stays
  config-free and a remote change applies on the next call. wallet-btc still reads no configuration:
  the batch size is injected through `WalletBtcCurrency.explorerBatchSize`, and the RBF ratio and
  the unconfirmed-operation expiry are parameters.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `CoinConfig`, `BitcoinConfigInfo`, `makeAssignFromAccountRaw`
  and `getMinRelayFee` are removed in favour of `BitcoinCoinConfig` / `BitcoinContext` and
  `assignFromAccountRaw`, and `postSync` becomes `makePostSync(context)`. The module logs only
  through `context.logger`: `buildTransaction`, `getTransactionStatus`, `prepareTransaction`,
  `calculateFees`, `signAccountTx`, `ChainAdapter.resolveFeePerByte`, `buildSignRawOperation` and the
  `hw-getAddress` / `hw-getFullViewingKey` resolvers take a `Logger`. `prepareTransaction`, `getTransactionStatus`, `buildTransaction`,
  `buildAccountTx`, `getOriginalTxFeeContext`, `getMinReplacementFeeSat`,
  `getMinReplacementFeeRateSatVb` and `getRbfContext` take the coin config as first parameter. The
  `getEditTransactionStatus` and `isStrategyDisabled` bridge extensions require the `mainAccount`. The `EXPLORER_REGTEST` and `BITCOIN_STUCK_TRANSACTION_TIMEOUT` envs are
  removed, as are the `config_currency_<id>` defaults of the bitcoin-family currencies no loader
  serves (`bitcoin_private`, `game_credits`, `gochain`, `lbry`, `nix`, `ravencoin`, `resistance`,
  `zclassic`, `zcoin`).

- [#22857](https://github.com/LedgerHQ/ledger-live/pull/22857) [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-module-boilerplate): read coin config from the context and drop live-env

- [#22858](https://github.com/LedgerHQ/ledger-live/pull/22858) [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Make coin-polkadot stateless: `createBridges` takes a `Context`, endpoints, tuning and cache TTLs come from `config_currency_polkadot`, logs go through `context.logger`, and the Polkadot env variables are removed.

## 0.9.0

### Minor Changes

- [#22612](https://github.com/LedgerHQ/ledger-live/pull/22612) [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Drop the Sui JSON-RPC transport, which the Sui Foundation retires, and make gRPC the default; GraphQL stays selectable through the `suiTransport` flag. coin-sui now owns the chain types it previously borrowed from `@mysten/sui/jsonRpc`.

## 0.9.0-next.0

### Minor Changes

- [#22612](https://github.com/LedgerHQ/ledger-live/pull/22612) [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Drop the Sui JSON-RPC transport, which the Sui Foundation retires, and make gRPC the default; GraphQL stays selectable through the `suiTransport` flag. coin-sui now owns the chain types it previously borrowed from `@mysten/sui/jsonRpc`.

## 0.8.0

### Minor Changes

- [#22003](https://github.com/LedgerHQ/ledger-live/pull/22003) [`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Record the provider app the Card login redirect names, and send x-us-env on every Card request of a US holder

- [#22006](https://github.com/LedgerHQ/ledger-live/pull/22006) [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Point the deprecation notices at `docs/configuration.md`, which is now the single guide for where a configuration value belongs and how to take one out of the env registry. `libs/env/MIGRATION.md` and `shared/env/MIGRATION.md` are removed — their content lives there, next to the app `.env` and build-secret mechanics it was already linking to. Comments and docs only.

- [#22038](https://github.com/LedgerHQ/ledger-live/pull/22038) [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): read the Baanx login and hosted manifest ids from the env, not from the `lwdPayTab` flag params

### Patch Changes

- Updated dependencies [[`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b)]:
  - @ledgerhq/live-env@4.1.0

## 0.8.0-next.0

### Minor Changes

- [#22003](https://github.com/LedgerHQ/ledger-live/pull/22003) [`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Record the provider app the Card login redirect names, and send x-us-env on every Card request of a US holder

- [#22006](https://github.com/LedgerHQ/ledger-live/pull/22006) [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Point the deprecation notices at `docs/configuration.md`, which is now the single guide for where a configuration value belongs and how to take one out of the env registry. `libs/env/MIGRATION.md` and `shared/env/MIGRATION.md` are removed — their content lives there, next to the app `.env` and build-secret mechanics it was already linking to. Comments and docs only.

- [#22038](https://github.com/LedgerHQ/ledger-live/pull/22038) [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): read the Baanx login and hosted manifest ids from the env, not from the `lwdPayTab` flag params

### Patch Changes

- Updated dependencies [[`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b)]:
  - @ledgerhq/live-env@4.1.0-next.0

## 0.7.0

### Minor Changes

- [#21661](https://github.com/LedgerHQ/ledger-live/pull/21661) [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Converge on a single Speculos transport and stop resolving Speculos config through the env singleton

  `@ledgerhq/hw-transport-node-speculos-http` and `@ledgerhq/hw-transport-node-speculos` are removed.
  The former was a duplicate of `@ledgerhq/live-dmk-speculos` — same class, same `SpeculosHttpTransportOpts`,
  same `SpeculosButton` enum, but without the DMK session cache, reconnect-on-APDU-failure and transient
  HTTP retries — and had a single consumer left. The latter implemented the websocket/TCP mode gated on
  `SPECULOS_USE_WEBSOCKET`, which defaulted to `false` and was never enabled anywhere; that definition is
  removed too. `@ledgerhq/live-dmk-speculos` is now the only Speculos transport, and it additionally
  exports `SpeculosButton`.

  `@ledgerhq/speculos-transport` loses the websocket branch, so `getPorts` has one shape,
  `SpeculosDeviceInternal` is no longer a union and `SpeculosTransport` is a single type. It no longer
  reads `@shared/env`: the Speculos PKI flag (`-p`) moves from `getEnv("PLAYWRIGHT_RUN") || getEnv("DETOX")`
  to an explicit `pki` field on `DeviceParams`, which `live-e2e-shared`'s `startSpeculos` sets — aligning
  the local Docker provider with the Speculinho provider, which already passed `-p` unconditionally.
  `@ledgerhq/live-dmk-speculos` resolves `SPECULOS_API_PORT` from `process.env` at the point of use
  instead of the env registry, so neither package depends on `@shared/env` any more.

  `@ledgerhq/live-cli` drops the `SPECULOS_APDU_PORT` / `SPECULOS_BUTTON_PORT` / `SPECULOS_HOST`
  websocket branch; use `SPECULOS_API_PORT`. The Canton integration test, the Solana smoke script and the
  disabled BTC integration test move to `@ledgerhq/live-dmk-speculos`, and the dead
  `hw-transport-node-speculos` devDependency is dropped from `coin-kaspa`, `hw-app-kaspa`, `hw-app-icon`
  and `ledger-wallet-framework`.

  `@ledgerhq/ledger-key-ring-protocol` declared `@ledgerhq/speculos-transport` and
  `@ledgerhq/hw-transport-mocker` as runtime `dependencies` even though both are only reachable from
  `tests/` and `src/__tests__/`, which `tsconfig.build.json` excludes from the published build. They
  move to `devDependencies`, so the Docker/Speculos harness is no longer part of the package's runtime
  dependency closure.

  Two further dead Speculos definitions leave `@shared/env`: `SPECULOS_PID_OFFSET`, which had no
  reference anywhere in the repo, and `SPECULOS_FIRMWARE_VERSION`, whose registry entry was unused
  because every reader (`live-common/src/load/speculos.ts`, `live-e2e-shared/src/speculosAppVersion.ts`,
  the CI workflows) already goes through `process.env`.

## 0.7.0-next.0

### Minor Changes

- [#21661](https://github.com/LedgerHQ/ledger-live/pull/21661) [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Converge on a single Speculos transport and stop resolving Speculos config through the env singleton

  `@ledgerhq/hw-transport-node-speculos-http` and `@ledgerhq/hw-transport-node-speculos` are removed.
  The former was a duplicate of `@ledgerhq/live-dmk-speculos` — same class, same `SpeculosHttpTransportOpts`,
  same `SpeculosButton` enum, but without the DMK session cache, reconnect-on-APDU-failure and transient
  HTTP retries — and had a single consumer left. The latter implemented the websocket/TCP mode gated on
  `SPECULOS_USE_WEBSOCKET`, which defaulted to `false` and was never enabled anywhere; that definition is
  removed too. `@ledgerhq/live-dmk-speculos` is now the only Speculos transport, and it additionally
  exports `SpeculosButton`.

  `@ledgerhq/speculos-transport` loses the websocket branch, so `getPorts` has one shape,
  `SpeculosDeviceInternal` is no longer a union and `SpeculosTransport` is a single type. It no longer
  reads `@shared/env`: the Speculos PKI flag (`-p`) moves from `getEnv("PLAYWRIGHT_RUN") || getEnv("DETOX")`
  to an explicit `pki` field on `DeviceParams`, which `live-e2e-shared`'s `startSpeculos` sets — aligning
  the local Docker provider with the Speculinho provider, which already passed `-p` unconditionally.
  `@ledgerhq/live-dmk-speculos` resolves `SPECULOS_API_PORT` from `process.env` at the point of use
  instead of the env registry, so neither package depends on `@shared/env` any more.

  `@ledgerhq/live-cli` drops the `SPECULOS_APDU_PORT` / `SPECULOS_BUTTON_PORT` / `SPECULOS_HOST`
  websocket branch; use `SPECULOS_API_PORT`. The Canton integration test, the Solana smoke script and the
  disabled BTC integration test move to `@ledgerhq/live-dmk-speculos`, and the dead
  `hw-transport-node-speculos` devDependency is dropped from `coin-kaspa`, `hw-app-kaspa`, `hw-app-icon`
  and `ledger-wallet-framework`.

  `@ledgerhq/ledger-key-ring-protocol` declared `@ledgerhq/speculos-transport` and
  `@ledgerhq/hw-transport-mocker` as runtime `dependencies` even though both are only reachable from
  `tests/` and `src/__tests__/`, which `tsconfig.build.json` excludes from the published build. They
  move to `devDependencies`, so the Docker/Speculos harness is no longer part of the package's runtime
  dependency closure.

  Two further dead Speculos definitions leave `@shared/env`: `SPECULOS_PID_OFFSET`, which had no
  reference anywhere in the repo, and `SPECULOS_FIRMWARE_VERSION`, whose registry entry was unused
  because every reader (`live-common/src/load/speculos.ts`, `live-e2e-shared/src/speculosAppVersion.ts`,
  the CI workflows) already goes through `process.env`.

## 0.6.0

### Minor Changes

- [#21418](https://github.com/LedgerHQ/ledger-live/pull/21418) [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Rename `CARD_API_URL` to `CARD_BAANX_API_URL`, keep the production defaults, and drop the Env vars section from the Card / Pay DevTool.

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

- [#21544](https://github.com/LedgerHQ/ledger-live/pull/21544) [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mark the whole public API deprecated and ship the migration guide. `getEnv`, `setEnv`, `setEnvUnsafe`, `getEnvDefault`, `getAllEnvs`, `injectDefinitions`, `changes`, the registry introspection helpers, the exported types and the `useEnv` hook now carry `@deprecated`. `libs/env/MIGRATION.md` documents the four exits every variable takes; `shared/env/MIGRATION.md` covers what that means inside ledger-live. No behaviour change.

- [#21428](https://github.com/LedgerHQ/ledger-live/pull/21428) [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show a Card login intro sheet on the first press of the card's action (LIVE-36793). The sheet has two
  buttons. "Log in to Baanx" runs the OAuth2 hosted login. "Create an account" opens the provider's
  own signup page, `/onboarding/signup` on the new `CARD_BAANX_HOSTED_UI` host, in the same browser. The
  intro shows once: a new persisted `payCardLoginIntro` flag goes up when a login the card holder just
  started reaches `ready`, and it survives an app restart inside the shared `payCard` blob. A hydrated
  session raises nothing. A tester resets the flag from the Pay Card devtool, and the intro shows again
  on the next press.

  The same flag now picks what the login block says, from the app's new `payTab.cardLogin.*` keys. It
  sells the card while the flag is down — "Get 1% cashback every time you spend" under a `Get card`
  button that opens the intro — and offers a login once the flag is up: "Log in to access your card"
  under a `Login` button that starts one. Its title is `Crypto Card`, and on mobile it is a Lumen
  `Subheader` under the card face, so the Pay Card flow no longer draws a section title above it there.
  Desktop keeps its host-provided title.

  The virtual card row names one wallet only: Apple Pay on iOS, Google Pay on Android. Desktop cannot
  see the phone the card will be added to, so it keeps naming both. Each row wraps its title and its
  description over as many lines as the copy needs, instead of cutting both off at the first.

  Hosts inject `onTrackEvent`. Get card, Login, the intro buttons and close fire `button_clicked`;
  opening the intro also fires `Page card login intro`.

  `CARD_BAANX_HOSTED_UI` defaults to `https://ledger-ew1uat.baanxapi.com`. Both apps read it with
  `useEnv` and hand it to the flow as `oauthConfig.hostedUiUrl`, so a new value moves the signup page
  to another tenant without a restart.

### Patch Changes

- Updated dependencies [[`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225)]:
  - @ledgerhq/live-env@4.0.0

## 0.6.0-next.0

### Minor Changes

- [#21418](https://github.com/LedgerHQ/ledger-live/pull/21418) [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Rename `CARD_API_URL` to `CARD_BAANX_API_URL`, keep the production defaults, and drop the Env vars section from the Card / Pay DevTool.

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

- [#21544](https://github.com/LedgerHQ/ledger-live/pull/21544) [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mark the whole public API deprecated and ship the migration guide. `getEnv`, `setEnv`, `setEnvUnsafe`, `getEnvDefault`, `getAllEnvs`, `injectDefinitions`, `changes`, the registry introspection helpers, the exported types and the `useEnv` hook now carry `@deprecated`. `libs/env/MIGRATION.md` documents the four exits every variable takes; `shared/env/MIGRATION.md` covers what that means inside ledger-live. No behaviour change.

- [#21428](https://github.com/LedgerHQ/ledger-live/pull/21428) [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show a Card login intro sheet on the first press of the card's action (LIVE-36793). The sheet has two
  buttons. "Log in to Baanx" runs the OAuth2 hosted login. "Create an account" opens the provider's
  own signup page, `/onboarding/signup` on the new `CARD_BAANX_HOSTED_UI` host, in the same browser. The
  intro shows once: a new persisted `payCardLoginIntro` flag goes up when a login the card holder just
  started reaches `ready`, and it survives an app restart inside the shared `payCard` blob. A hydrated
  session raises nothing. A tester resets the flag from the Pay Card devtool, and the intro shows again
  on the next press.

  The same flag now picks what the login block says, from the app's new `payTab.cardLogin.*` keys. It
  sells the card while the flag is down — "Get 1% cashback every time you spend" under a `Get card`
  button that opens the intro — and offers a login once the flag is up: "Log in to access your card"
  under a `Login` button that starts one. Its title is `Crypto Card`, and on mobile it is a Lumen
  `Subheader` under the card face, so the Pay Card flow no longer draws a section title above it there.
  Desktop keeps its host-provided title.

  The virtual card row names one wallet only: Apple Pay on iOS, Google Pay on Android. Desktop cannot
  see the phone the card will be added to, so it keeps naming both. Each row wraps its title and its
  description over as many lines as the copy needs, instead of cutting both off at the first.

  Hosts inject `onTrackEvent`. Get card, Login, the intro buttons and close fire `button_clicked`;
  opening the intro also fires `Page card login intro`.

  `CARD_BAANX_HOSTED_UI` defaults to `https://ledger-ew1uat.baanxapi.com`. Both apps read it with
  `useEnv` and hand it to the flow as `oauthConfig.hostedUiUrl`, so a new value moves the signup page
  to another tenant without a restart.

### Patch Changes

- Updated dependencies [[`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225)]:
  - @ledgerhq/live-env@4.0.0-next.0

## 0.5.0

### Minor Changes

- [#21104](https://github.com/LedgerHQ/ledger-live/pull/21104) [`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b) Thanks [@henri-ly](https://github.com/henri-ly)! - Point `A4_URL_PRD` at the Ledger Wallet base URL `https://explorers.api.live.ledger.com/a4` instead of the Vault one.

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

### Patch Changes

- Updated dependencies [[`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/live-env@3.2.0

## 0.5.0-next.0

### Minor Changes

- [#21104](https://github.com/LedgerHQ/ledger-live/pull/21104) [`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b) Thanks [@henri-ly](https://github.com/henri-ly)! - Point `A4_URL_PRD` at the Ledger Wallet base URL `https://explorers.api.live.ledger.com/a4` instead of the Vault one.

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

### Patch Changes

- Updated dependencies [[`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/live-env@3.2.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

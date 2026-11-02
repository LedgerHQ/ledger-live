---
"@ledgerhq/coin-solana": minor
"@ledgerhq/live-common": minor
"@shared/env": minor
"ledger-live-desktop": patch
---

fix(coin-solana): read endpoints and tuning values from the coin config

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

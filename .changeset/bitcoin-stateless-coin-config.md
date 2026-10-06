---
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/wallet-btc": minor
"@ledgerhq/live-common": minor
"@ledgerhq/types-live": minor
"@shared/env": minor
"@ledgerhq/coin-tester-bitcoin": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

fix(coin-bitcoin): read the explorer and tuning values from the injected coin config

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

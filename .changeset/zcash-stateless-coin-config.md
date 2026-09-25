---
"@ledgerhq/coin-zcash": minor
"@ledgerhq/live-common": minor
---

fix(coin-zcash): read endpoints and sync limits from the injected coin config

The module no longer keeps configuration in module state. `createBridges` takes a `Context`
(ADR-019) and sync, sign and broadcast resolve `config_currency_zcash` from `context.config()` on
every call. The endpoints `zaino.url` and `explorer.url` are required and default to the production
hosts in `config_currency_zcash`; the mainnet Zaino default no longer points at staging. The
optional tuning fields `zaino.timeoutMs` (per-chunk budget of the automatic shielded sync) and
`zaino.batchSize` (blocks per shielded scan chunk) fall back to the module defaults
`ZCASH_SHIELDED_CHUNK_TIMEOUT_MS` (120000) and `ZCASH_SHIELDED_BATCH_SIZE` (5000). All of them can
be changed through the remote currency config without a release. The explorer is bound from the
config at use, so deserialization stays config-free. `setCoinConfig`, `getCoinConfig`,
`setZainoGrpcUrl`, the `ZCASH_GRPC_URL_*` and `ZCASH_AUTO_SYNC_TIMEOUT_MS` constants and the
`ZcashConfigInfo` type are removed in favour of `ZcashCoinConfig` / `ZcashContext`.

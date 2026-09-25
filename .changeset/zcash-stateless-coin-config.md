---
"@ledgerhq/coin-zcash": minor
"@ledgerhq/live-common": minor
---

fix(coin-zcash): read endpoints and sync limits from the injected coin config

The module no longer keeps configuration in module state. `createBridges` takes a `Context`
(ADR-019) and sync, sign and broadcast resolve `config_currency_zcash` from `context.config()` on
every call: `zaino.url`, `zaino.timeoutMs` (per-chunk budget of the automatic shielded sync),
`zaino.batchSize` (blocks per shielded scan chunk) and `explorer.url`. The explorer is bound from
the config at use, so deserialization stays config-free. Defaults are the production hosts and
the previous limits (120000 ms, 5000 blocks), and all four can be changed through the remote
currency config without a release; the mainnet Zaino default no longer points at staging.
`setCoinConfig`, `getCoinConfig`, `setZainoGrpcUrl`, the `ZCASH_GRPC_URL_*` and
`ZCASH_AUTO_SYNC_TIMEOUT_MS` constants and the `ZcashConfigInfo` type are removed in favour of
`ZcashCoinConfig` / `ZcashContext`.

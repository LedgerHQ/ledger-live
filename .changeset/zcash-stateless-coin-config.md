---
"@ledgerhq/coin-zcash": minor
"@ledgerhq/live-common": minor
---

fix(coin-zcash): read endpoints from the injected coin config

The module no longer keeps configuration in module state. `createBridges` takes a `Context`
(ADR-019) and sync, sign and broadcast resolve `zaino.url` and `explorer.url` from
`context.config()` on every call; the explorer is bound from the config at use, so deserialization
stays config-free. Both default to the production hosts in `config_currency_zcash` and can be
changed through the remote currency config without a release; the mainnet Zaino default no longer
points at staging. `setCoinConfig`, `getCoinConfig`, `setZainoGrpcUrl`, the `ZCASH_GRPC_URL_*`
constants and the `ZcashConfigInfo` type are removed in favour of `ZcashCoinConfig` / `ZcashContext`.

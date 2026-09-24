---
"@ledgerhq/coin-zcash": minor
"@ledgerhq/live-common": minor
---

fix(coin-zcash): read endpoints from the coin config

The module reads ZCASH_GRPC_URL, EXPLORER from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for zcash live in live-common and keep today's values, except the Zaino mainnet default, which now points at the production indexer instead of staging.

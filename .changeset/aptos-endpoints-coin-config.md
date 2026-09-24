---
"@ledgerhq/coin-aptos": minor
"@ledgerhq/live-common": minor
---

refactor(coin-aptos): read endpoints from the coin config

The module reads APTOS_API_ENDPOINT, APTOS_INDEXER_ENDPOINT from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for aptos, aptos_testnet live in live-common and keep today's values.

---
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/live-common": minor
---

refactor(coin-bitcoin): read endpoints from the coin config

The module reads EXPLORER from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for every UTXO currency, bitcoin_testnet and bitcoin_regtest live in live-common and keep today's values.

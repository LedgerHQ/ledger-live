---
"@ledgerhq/coin-cardano": minor
"@ledgerhq/live-common": minor
---

refactor(coin-cardano): read endpoints from the coin config

The module reads CARDANO_API_ENDPOINT, CARDANO_EPOCH_PARAMS_ENDPOINT from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for cardano, cardano_testnet live in live-common and keep today's values.

---
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/live-common": minor
---

refactor(coin-multiversx): read endpoints from the coin config

The module reads MULTIVERSX_API_ENDPOINT, MULTIVERSX_DELEGATION_API_ENDPOINT from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for multiversx live in live-common and keep today's values.

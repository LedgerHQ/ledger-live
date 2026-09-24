---
"@ledgerhq/coin-algorand": minor
"@ledgerhq/live-common": minor
---

refactor(coin-algorand): read endpoints from the coin config

The module reads API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for algorand live in live-common and keep today's values.

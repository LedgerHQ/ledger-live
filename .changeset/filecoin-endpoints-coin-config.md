---
"@ledgerhq/coin-filecoin": minor
"@ledgerhq/live-common": minor
---

refactor(coin-filecoin): read endpoints from the coin config

The module reads API_FILECOIN_ENDPOINT from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for filecoin live in live-common and keep today's values.

---
"@ledgerhq/coin-canton": minor
"@ledgerhq/live-common": minor
---

refactor(coin-canton): read endpoints from the coin config

The module reads CAL_SERVICE_URL from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for the three Canton networks live in live-common and keep today's values.

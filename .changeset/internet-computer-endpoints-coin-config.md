---
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/live-common": minor
---

refactor(coin-internet_computer): read endpoints from the coin config

The module reads ICP_NETWORK_URL from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for internet_computer live in live-common and keep today's values.

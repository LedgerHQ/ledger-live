---
"@ledgerhq/coin-concordium": minor
"@ledgerhq/live-common": minor
---

refactor(coin-concordium): read endpoints from the coin config

The module reads API_CONCORDIUM_WALLETCONNECT_RELAY from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for concordium, concordium_testnet live in live-common and keep today's values.

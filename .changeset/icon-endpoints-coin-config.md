---
"@ledgerhq/coin-icon": minor
"@ledgerhq/live-common": minor
---

refactor(coin-icon): read endpoints from the coin config

The module reads ICON_INDEXER_ENDPOINT, ICON_NODE_ENDPOINT, ICON_DEBUG_ENDPOINT from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for icon, icon_berlin_testnet live in live-common and keep today's values.

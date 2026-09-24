---
"@ledgerhq/coin-celo": minor
"@ledgerhq/live-common": minor
---

refactor(coin-celo): read endpoints from the coin config

The module reads API_CELO_INDEXER (the node is read from the existing `node.uri`) from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for celo live in live-common and keep today's values.

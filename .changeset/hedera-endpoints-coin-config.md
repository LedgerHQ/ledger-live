---
"@ledgerhq/coin-hedera": minor
"@ledgerhq/live-common": minor
---

refactor(coin-hedera): read endpoints from the coin config

The module reads LEDGER_COUNTERVALUES_API from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for hedera, hedera_testnet live in live-common and keep today's values.

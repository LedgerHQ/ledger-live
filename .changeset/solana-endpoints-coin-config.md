---
"@ledgerhq/coin-solana": minor
"@ledgerhq/live-common": minor
---

refactor(coin-solana): read endpoints from the coin config

The module reads API_SOLANA_PROXY, SOLANA_VALIDATORS_APP_BASE_URL, SOLANA_VALIDATORS_SUMMARY_BASE_URL, NFT_METADATA_SERVICE from `config_currency_<id>.infra` at call time instead of the environment
or a constant, so an endpoint can be changed through the remote currency config without a release.
Defaults for solana, solana_testnet, solana_devnet live in live-common and keep today's values.

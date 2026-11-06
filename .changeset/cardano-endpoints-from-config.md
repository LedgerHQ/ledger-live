---
"@ledgerhq/coin-cardano": major
"@shared/env": minor
---

Read the Cardano API and epoch-params endpoints from the coin config (`api.url`, `epochParams.url`) instead of the `CARDANO_*_ENDPOINT` env variables, which are removed

**Breaking change**: `CardanoConfig` gains the required `api: { url: string }` and `epochParams: { url: string }`, and `CARDANO_API_ENDPOINT`, `CARDANO_TESTNET_API_ENDPOINT`, `CARDANO_EPOCH_PARAMS_ENDPOINT` and `CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT` are no longer exported from `src/constants`. Each currency config carries its own endpoints, so a consumer that builds its own config (such as the coin-service) passes them there; `cardanoDefaults` holds the Ledger defaults.

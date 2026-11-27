---
"@ledgerhq/coin-canton": major
"@ledgerhq/live-common": minor
---

Read the coin-canton gateway page size, cache TTLs, reserve and gateway switch from `config_currency_canton_network*`, where they are required with their values in `cantonDefaults`; an invalid or missing value throws `CantonInvalidConfigError`. `gatewayUrl` and `nodeId` are required, `nodeUrl` is dropped, and the network functions and caches take the `CantonContext` first.

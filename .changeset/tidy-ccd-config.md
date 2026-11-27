---
"@ledgerhq/coin-concordium": major
"@shared/env": minor
---

Read every Concordium tuning value and the WalletConnect project id from the coin config, and inject the config and the logger through the context

**Breaking change**: the logic and network functions take a `ConcordiumContext` as their first argument instead of a resolved `ConcordiumCoinConfig`, and log through `context.logger`; `withConfig(context, config)` pins a context to one config. The tuning fields of `ConcordiumConfig` are required and their values live in `concordiumDefaults`; the `DEFAULT_*` constants are removed, and an invalid or missing value throws `ConcordiumInvalidConfigError`. `ConcordiumBridgeConfig.walletConnect` gains `projectId`, replacing the removed `WALLETCONNECT_PROJECT_ID` env. A consumer that builds its own config, such as the coin-service, spreads `concordiumDefaults`.

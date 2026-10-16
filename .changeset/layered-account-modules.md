---
"@ledgerhq/account-module-framework": minor
"@ledgerhq/account-module-single-address": minor
"@ledgerhq/account-module-utxo": minor
"@ledgerhq/portfolio-module-framework": minor
"@ledgerhq/portfolio-module-local": minor
"@ledgerhq/portfolio-module-portfolio-service": minor
"@ledgerhq/portfolio-module-hybrid": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
---

Add the account and portfolio layers of ADR-064 Option 1 on top of CoinModuleApi: the AccountModuleApi contract with its single-address and UTXO account modules, and the PortfolioApi contract (shaped like portfolio-service) served locally, by portfolio-service, or both, chosen per chain by the `portfolio.mode` of its coin config (local, hybrid or remote). coin-bitcoin exposes the UTXO primitives the account layer delegates to, and the generic bridge serves bitcoin through the UTXO account module instead of the interim account layer. A chain whose coin config sets `portfolio.enabled` is served by the generic bridge through the PortfolioApi (sync, fees, crafting, combining, broadcast), the legacy path staying the default; `config_portfolio_service` sets the portfolio-service url of the hybrid and remote modes. With `portfolio.enabled`, nothing in the bridge, its extensions or the family helpers goes around the portfolio layer any more: the portfolio models carry what the legacy path read from the coin module (extensions of the framework served by local and routed by hybrid), and local mode gives the same accounts and transactions as the legacy path, checked by a parity harness, a no-bypass test and an import-boundary lint rule. Account module reads (balances, operations, pending operations, stakes, UTXOs, addresses, fresh address) answer from the stored state without network calls, or refresh their own scope with `refresh: true`, and return `{ value, updatedAt }` (`updatedAt` undefined when just refreshed); the account state goes through a client-provided `StateStore`.

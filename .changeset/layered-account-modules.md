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

Add the account and portfolio layers of ADR-064 Option 1 on top of CoinModuleApi: the AccountModuleApi contract with its single-address and UTXO account modules, and the PortfolioApi contract (shaped like portfolio-service) served locally, by portfolio-service, or both. coin-bitcoin exposes the UTXO primitives the account layer delegates to, and the generic bridge serves bitcoin through the UTXO account module instead of the interim account layer

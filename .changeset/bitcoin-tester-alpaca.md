---
"@ledgerhq/ledger-wallet-framework": minor
---

Generic coin framework: add descriptor-account (extended-public-key) support to `BridgeApi`. `usesDescriptorDerivationPath` forwards the account's derivation path to `getBalance`/`listOperations` and sets the intent's `senderDerivationPath`; `buildIntentData` maps a family's transaction fields onto the intent's `data`. Enables driving the coin-bitcoin Alpaca `createApi` through the generic coin framework (coin-tester).

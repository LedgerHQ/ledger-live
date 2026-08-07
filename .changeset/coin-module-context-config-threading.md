---
"@ledgerhq/coin-tester-cardano": minor
"@ledgerhq/coin-tester-casper": minor
"@ledgerhq/coin-module-boilerplate": minor
"@ledgerhq/coin-tester-evm": minor
"@ledgerhq/coin-concordium": minor
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/coin-algorand": minor
"@ledgerhq/coin-filecoin": minor
"@ledgerhq/coin-polkadot": minor
"@ledgerhq/coin-cardano": minor
"@ledgerhq/coin-vechain": minor
"@ledgerhq/coin-canton": minor
"@ledgerhq/coin-casper": minor
"@ledgerhq/coin-cosmos": minor
"@ledgerhq/coin-hedera": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-aptos": minor
"@ledgerhq/coin-kaspa": minor
"@ledgerhq/coin-aleo": minor
"@ledgerhq/coin-celo": minor
"@ledgerhq/coin-near": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/coin-sui": minor
"@ledgerhq/coin-ton": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
"@features/flow-contacts": minor
"@ledgerhq/live-e2e-shared": minor
"@ledgerhq/wallet-cli": minor
"ledger-live-mobile-e2e-tests": minor
"@shared/env": minor
---

Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

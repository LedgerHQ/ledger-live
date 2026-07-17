---
"@ledgerhq/coin-aleo": minor
"@ledgerhq/coin-algorand": minor
"@ledgerhq/coin-aptos": minor
"@ledgerhq/coin-canton": minor
"@ledgerhq/coin-cardano": minor
"@ledgerhq/coin-celo": minor
"@ledgerhq/coin-filecoin": minor
"@ledgerhq/coin-hedera": minor
"@ledgerhq/coin-modules-monitoring": minor
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-stacks": minor
"@ledgerhq/coin-sui": minor
"@ledgerhq/coin-tester-evm": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-vechain": minor
"@ledgerhq/live-cli": minor
---

Relocate the token-store accessor imports from `@ledgerhq/cryptoassets/state` onto the wallet-framework port (`@ledgerhq/ledger-wallet-framework/cryptoAssetsStore`). Apps and coin-modules now read `getCryptoAssetsStore` from the framework's injectable singleton; apps inject at bootstrap via `setCryptoAssetsStore` from the same port.

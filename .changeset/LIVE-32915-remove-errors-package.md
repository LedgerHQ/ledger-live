---
"@ledgerhq/coin-aleo": minor
"@ledgerhq/coin-algorand": minor
"@ledgerhq/coin-aptos": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/coin-canton": minor
"@ledgerhq/coin-cardano": minor
"@ledgerhq/coin-casper": minor
"@ledgerhq/coin-celo": minor
"@ledgerhq/coin-concordium": minor
"@ledgerhq/coin-cosmos": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/coin-filecoin": minor
"@ledgerhq/coin-hedera": minor
"@ledgerhq/coin-icon": minor
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/coin-kaspa": minor
"@ledgerhq/coin-mina": minor
"@ledgerhq/coin-module-boilerplate": minor
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/coin-near": minor
"@ledgerhq/coin-polkadot": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-stacks": minor
"@ledgerhq/coin-sui": minor
"@ledgerhq/coin-tester-stellar": minor
"@ledgerhq/coin-tester-xrp": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-vechain": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

`@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

---
"@ledgerhq/coin-aleo": patch
"@ledgerhq/coin-algorand": patch
"@ledgerhq/coin-aptos": patch
"@ledgerhq/coin-bitcoin": patch
"@ledgerhq/coin-canton": patch
"@ledgerhq/coin-cardano": patch
"@ledgerhq/coin-casper": patch
"@ledgerhq/coin-celo": patch
"@ledgerhq/coin-concordium": patch
"@ledgerhq/coin-cosmos": patch
"@ledgerhq/coin-evm": patch
"@ledgerhq/coin-filecoin": patch
"@ledgerhq/coin-hedera": patch
"@ledgerhq/coin-icon": patch
"@ledgerhq/coin-internet_computer": patch
"@ledgerhq/coin-kaspa": patch
"@ledgerhq/coin-mina": patch
"@ledgerhq/coin-module-boilerplate": patch
"@ledgerhq/coin-multiversx": patch
"@ledgerhq/coin-near": patch
"@ledgerhq/coin-polkadot": patch
"@ledgerhq/coin-solana": patch
"@ledgerhq/coin-stacks": patch
"@ledgerhq/coin-sui": patch
"@ledgerhq/coin-tester-stellar": patch
"@ledgerhq/coin-tester-xrp": patch
"@ledgerhq/coin-ton": patch
"@ledgerhq/coin-tron": patch
"@ledgerhq/coin-vechain": patch
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

`@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

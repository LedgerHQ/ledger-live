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
"@ledgerhq/coin-tezos": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-vechain": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Stop depending on `@ledgerhq/errors` (LIVE-32915).

No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

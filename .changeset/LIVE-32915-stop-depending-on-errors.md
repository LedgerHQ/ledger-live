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
"@ledgerhq/coin-tezos": patch
"@ledgerhq/coin-ton": patch
"@ledgerhq/coin-tron": patch
"@ledgerhq/coin-vechain": patch
"@ledgerhq/live-common": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Stop depending on `@ledgerhq/errors` (LIVE-32915).

No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

---
"@ledgerhq/live-common": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/coin-celo": patch
"@ledgerhq/coin-canton": minor
"@ledgerhq/coin-concordium": minor
"@ledgerhq/coin-aleo": minor
"@ledgerhq/coin-zcash": minor
"@ledgerhq/ledger-wallet-framework": patch
"ledger-live-desktop": minor
---

Account discovery on descriptors, finding the same accounts as the legacy scan for every family: `accountStatus` answered for accounts the store does not hold (a coin module's `getAccountStatus` on the descriptor key for TON, Canton and Concordium, else the full sync), derivations for Zcash, Kaspa, Cardano and Hedera, a discovery stream, its Device Intent and a DevTools page

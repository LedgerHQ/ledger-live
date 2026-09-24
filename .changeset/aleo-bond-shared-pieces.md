---
"@ledgerhq/coin-aleo": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

feat(aleo): share the bond pieces between Desktop and Mobile

Replaces the ad-hoc messages `getTransactionStatus` returned for a rejected bond with typed
error classes, translated on both clients and now distinguishing a closed validator from an
unbonding one. Adds the `isValidatorBondable` / `getMinBondAmount` helpers to the coin
module, moves the per-network default validator into the Aleo currency config so every
client reads the same address, and adds a reusable Aleo bridge mock for Mobile.

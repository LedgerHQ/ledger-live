---
"@ledgerhq/live-countervalues": minor
"@ledgerhq/live-countervalues-react": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
---

Move the account-coupled tracking-pair code out of the countervalues packages and into `live-common`, next to the portfolio code it belongs with. `inferTrackingPairForAccounts` and `inferTrackingPairForAccountsUnresolved` leave `live-countervalues/logic`, and the `useTrackingPairForAccounts` hook that wraps them leaves `live-countervalues-react`.

These three were the last things in the countervalues core that needed an `Account`, so `@ledgerhq/types-live` is now gone from the package entirely and from its dependency list. The core no longer knows what an account is; it only knows currency pairs and rates.

The move was blocked until both packages became private: a published package cannot depend on a private one, and the hook re-exported a function that had to land in private `live-common`.

---
"@ledgerhq/live-common": minor
"@ledgerhq/ledger-wallet-framework": minor
---

Carry a chain's staking positions through the generic coin framework, and keep sub-accounts
aligned with what the chain reports:

- an unbonding position with no validator is no longer dropped from the account's list
- `extractBalances` rebuilds staking positions, so a family validating a staking intent finds them
- a position reads as withdrawable only when the chain offers a withdraw on it
- `mergeSubAccounts` keeps only the sub-accounts the chain still reports, instead of letting a pruned one survive with a stale balance
- a pending operation shows the user's memo only on a plain transfer

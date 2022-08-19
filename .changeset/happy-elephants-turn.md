---
"@ledgerhq/live-common": minor
---

The Ledger QA team discovered that an error could occur when calculating the max spendable and max non-voting locked balance when pending operations existed. These balances are set when the account syncs, and these balances will not take into account pending operations - leaving it to be higher than it truly is. This results in a runtime error related to trying to create a transaction that is larger than the respective balance.

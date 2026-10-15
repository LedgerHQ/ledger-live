---
"@domain/entity-account-data": minor
"@domain/api-account-data-source": minor
"@features/platform-account-data": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

feat(account-data): add the account data framework

Kind registry and entity binding, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchAccountDataBatch` and the `useAccountData` hook. Both apps inject the router into the thunk `extraArgument`, with no source yet.

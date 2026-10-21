---
"@domain/entity-account-data": minor
"@domain/api-account-data": minor
"@features/platform-account-data": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

feat(account-data): add the account data framework

Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

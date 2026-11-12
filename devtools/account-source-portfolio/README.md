# @devtools/account-source-portfolio

The Portfolio account data source at work. Turned on, it injects the source in the router ranked first (`addAccountDataSource(source, { first: true })`), so the source takes the balance and operations reads of the accounts it supports (EVM only for now), each waiting until the service has the account ready; turned off, it removes it.

For each local account: whether the source supports it, its registration, its service account id and status, and how its last balance read went (served, or the error it failed with). Below: the registrations no local account needs, which Reconcile removes, and the activity of the source against the service.

Imports no `@devtools/*` package ([import boundaries](../../.agents/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountSourcePortfolioToolProps` in `@devtools/bindings`.

# @devtools/account-source-portfolio

The Portfolio account data source at work. Turned on, it injects the source in the router ranked first (`addAccountDataSource(source, { first: true })`), so the source takes the EVM balances and hands back the accounts it cannot answer; turned off, it removes it.

For each local account: its registration, its service account id and status, and how its last balance read went (served, or fell through while waiting or on an error). Below: the registrations no local account needs, which Reconcile removes, and the activity of the source against the service.

Imports no `@devtools/*` package ([import boundaries](../../.agents/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountSourcePortfolioToolProps` in `@devtools/bindings`.

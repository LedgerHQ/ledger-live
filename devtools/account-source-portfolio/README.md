# @devtools/account-source-portfolio

The Portfolio account data source at work. Turned on, it injects the source in the router ranked first (`addAccountDataSource(source, { first: true })`); turned off, it removes it. The source serves no read yet, so injecting it changes nothing for the app.

For each local account: whether the source supports it (EVM only for now), its registration, its service account id and status, and how its last read went once the source serves reads. Below: the registrations no local account needs, which Reconcile removes, and the activity of the source against the service.

Imports no `@devtools/*` package ([import boundaries](../../.agents/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountSourcePortfolioToolProps` in `@devtools/bindings`.

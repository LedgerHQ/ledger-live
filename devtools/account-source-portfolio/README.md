# @devtools/account-source-portfolio

The Portfolio account data source at work: the local accounts next to the service portfolio (registration, service accounts and their status, the outcome of the last balance read through the source), the registrations no account needs, and the activity of the source against the service. The tool drives the source: turned on, it is injected in the router ranked first (`addAccountDataSource(source, { first: true })`), so it takes over the accounts it supports and hands back the ones it cannot answer; turned off, it is removed. Reconcile registers what is missing and removes what no account needs.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountSourcePortfolioToolProps` in `@devtools/bindings`.

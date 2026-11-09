# @devtools/account-transaction

Sends from an account of the accounts slice through `@domain/api-account-transaction`:

- **Prepare** and **Estimate fees** work on any account: the form maps to a `SendRequest`, the prepared amounts, fees, errors and warnings show below.
- **Sign and broadcast** works on mock accounts only, with a simulated signature. A real account stops at the preparation: signing it needs the sign Device Intent (`@features/platform-sign-account-transaction-intent`), not wired in this tool yet. The broadcast hash and the pending rows it added to Account Operation show once done.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.agents/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountTransactionToolProps` in `@devtools/bindings`.

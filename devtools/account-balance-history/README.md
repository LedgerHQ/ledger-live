# @devtools/account-balance-history

The balanceHistory kind of each account (`@domain/entity-account-balance-history`) for a range picked in the tool: one row per asset with its points, first and last balance and a sparkline, the source that answered, the last error, and buttons to read it again.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountBalanceHistoryToolProps` in `@devtools/bindings`.

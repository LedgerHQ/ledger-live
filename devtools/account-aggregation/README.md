# @devtools/account-aggregation

Reads the balance of every account in one tick and shows the answer as one payload: the total per asset, which source answered each account, and the calls the router made on each source. It shows the router splitting one batch between sources and putting the answers back together.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountAggregationToolProps` in `@devtools/bindings`, fed by the host's `AccountDataRecorder`.

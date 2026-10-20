# @devtools/account-data

The account data layer at work: the status of every read (`accountData` slice) and the history of what happened (reads requested, answered, failed, and each source call the router made).

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountDataToolProps` in `@devtools/bindings`, fed by an `AccountDataRecorder` the host plugs into its store and sources.

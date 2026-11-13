# @devtools/account-status

The `accountStatus` and `assetStatus` kinds of each account (`@domain/entity-account-status`): whether it was ever used, its account gate and send gate, and per asset read its gate and receive gate, with the source that answered, the last error, and buttons to read them again.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountStatusToolProps` in `@devtools/bindings`.

# @devtools/receive

Debug controls for the new receive flow, one section per concern:

- **Feature flag**: turns `newReceiveFlow` on or off, and sets the families that keep the legacy receive flow (`excludedFamilies`).

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useReceiveToolProps` in `@devtools/bindings`.

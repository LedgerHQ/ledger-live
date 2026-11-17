# @devtools/account-detail

Debug controls for the Account Detail page, one section per concern:

- **Analytics card**: shows whether the card that redirects to Analytics (`@features/flow-account-detail-analytics-notice`) was dismissed and whether this install is eligible to see it, and resets the dismissal so it shows again.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useAccountDetailToolProps` in `@devtools/bindings`.

# @devtools/dev-settings

App-wide developer settings, grouped in one DevTools page.

- **Toggles**: switches the host owns and passes in `toggles`. When a toggle can't apply on this build, the host sets its `lockedReason`: the switch stays visible but locked, with the reason shown under it.

Ledger Wallet Desktop passes the "Hide pre-release overlay" toggle, which hides the PRERELEASE watermark of nightly builds. To add a setting, give the host one more toggle; the tool doesn't change.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.agents/skills/devtools-import-boundary/SKILL.md)). Desktop builds its props in `apps/ledger-live-desktop/src/mvvm/features/DevTools/DevSettings/`, because its settings live in the app's store.

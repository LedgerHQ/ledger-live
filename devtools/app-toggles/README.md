# @devtools/app-toggles

App-wide switches for developers, grouped in one DevTools page. The host owns each switch and passes it in `toggles`. When a toggle can't apply on this build, the host sets its `lockedReason`: the switch stays visible but locked, with the reason shown under it.

Ledger Wallet Desktop passes the "Hide pre-release overlay" toggle, which hides the PRERELEASE watermark of nightly builds. To add a toggle, give the host one more entry in `toggles`; the tool doesn't change.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.agents/skills/devtools-import-boundary/SKILL.md)). Desktop builds its props in `apps/ledger-live-desktop/src/mvvm/features/DevTools/AppToggles/`, because its toggles live in the app's store.

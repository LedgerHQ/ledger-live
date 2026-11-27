# @devtools/app-toggles

App-wide switches for developers, grouped in one DevTools page, on web and native. The host owns each switch and passes it in `toggles`. When a toggle can't apply on this build, the host sets its `lockedReason`: the switch stays visible but locked, with the reason shown under it.

| Host                  | Toggle                      | What it does                                                         |
| --------------------- | --------------------------- | -------------------------------------------------------------------- |
| Ledger Wallet Desktop | Hide pre-release overlay    | Hides the PRERELEASE watermark of nightly builds                     |
| Ledger Wallet Mobile  | Simulate an Apollo device   | The new Settings hide the rows Apollo always hides                    |

To add a toggle, give the host one more entry in `toggles`; the tool doesn't change.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.agents/skills/devtools-import-boundary/SKILL.md)). Each app builds its props in `src/mvvm/features/DevTools/AppToggles/`, because its toggles live in the app's store.

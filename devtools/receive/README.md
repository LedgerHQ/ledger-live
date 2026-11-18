# @devtools/receive

Debug controls for the new receive flow, one section per concern:

- **Feature flag**: turns `newReceiveFlow` on or off, and sets the families that keep the legacy receive flow (`excludedFamilies`).
- **Receive list**: opens receive on any account's coin or token in one tap, or from the asset selection step.
- **Deeplink**: fires a receive deeplink (`ledgerwallet://receive?currency=ethereum` by default) as the OS would. **Open** stays disabled until the input holds a valid URL.

A tapped row calls `trigger.onReceive({ legacyAccountId, assetId })`, the arguments of `toReceiveTarget` in `@features/flow-receive`. The receive list and the deeplink go through the app's own receive opener and deeplink handler, which the host passes as `trigger`.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useReceiveToolProps` in `@devtools/bindings`.

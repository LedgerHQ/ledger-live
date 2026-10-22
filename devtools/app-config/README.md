# @devtools/app-config

The App config DevTool. Shows once the default option of the build, which every switch without a
saved option uses, then lists each switch the host declares with
[`@shared/app-config`](../../shared/app-config/README.md): its options and their values, what this
session runs on and, when it differs, what the next session will. The fixed values follow, each
with its value.

A build whose default is staging also runs on dev values, which the host saves. The tool shows
them read-only, with Dev as what a switch or a fixed value runs on.

Selecting an option saves it right away, and selecting the default removes the saved selection
instead, so the switch follows the default again. Nothing reloads: the configuration is resolved
once per session, and a reload can be slow under a debugger or on an emulator, so the Reload button
(Restart on mobile) applies every saved change at once. It only appears, with the number of
changes, while something saved differs from what the session runs on.

A search bar matches the switches by label, id or value name and the fixed values by name, and the
All / Switched filter keeps only what runs, or will run, on another choice than the default. Both
stay at the top of the list and scroll with it.

## Props contract

```ts
interface AppConfigToolProps {
  // `undefined` until the host has the session.
  session?: {
    defaultOptionId: ConfigOptionId;
    switches: readonly ConfigSwitchState[];
    fixedValues: readonly ConfigFixedValueState[];
  };
  onSelect: (id: string, selectionId: ConfigSelectionId) => void;
  onResetSelection: (id: string) => void;
  onReloadApp: () => void;
}
```

Each value carries what this session runs on and what the next one will, so the tool only compares
them. `useAppConfigToolProps()` from `@devtools/bindings` builds the props from the `appConfig`
slice of the store with `resolveAppConfigValues`, and dispatches the actions of
`@shared/app-config`. The app-config middleware saves each change, and on reload reloads the
renderer on desktop and restarts the app on mobile.

## Imports

This tool imports no `@devtools/*` package. Every other `@devtools/*` import is forbidden, see
[devtools-import-boundary](../../.agents/skills/devtools-import-boundary/SKILL.md).

# @devtools/app-config

The App config DevTool. Shows once the default option of the build, which every switch without a
saved option uses, then lists each switch the host declares with
[`@shared/app-config`](../../shared/app-config/README.md): its options and their values, what this
session runs on and, when it differs, what the next session will. The fixed values follow, each
with its value. Every value shows in a field, read-only unless its row is on Dev, so a row keeps its
layout when it switches.

On a build whose default is staging, each switch offers **Dev | Staging | Prod** and each fixed
value **Dev | Fixed**. On Dev the fields are editable, and start from the staging or fixed value.
A field saves its text when it loses focus, on Enter, or before a reload or an option change, unless
the text is empty or the base value, which removes the dev value instead. Reset removes a saved
one. The host parses each dev value with its schema: the field shows why it refused one, saves
nothing, and keeps the app from reloading until the text is fixed, emptied or reset. A value that
is not a string stays read-only.

Selecting an option saves it right away, and selecting the default (or Fixed) removes the saved
selection instead, so it follows the default again. Nothing reloads: the configuration is resolved
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
  onSetDevValue: (name: string, value: string) => boolean;
  onRemoveDevValue: (name: string) => void;
  onReloadApp: () => void;
}
```

Each value carries what this session runs on, what the next one will, and its base value, so the
tool only compares them. The tool offers Dev when the default is staging. `useAppConfigToolProps()`
from `@devtools/bindings` builds the props from the `appConfig` slice of the store with
`resolveAppConfigValues`, and dispatches the actions of `@shared/app-config`. The app-config
middleware saves each change, and on reload reloads the renderer on desktop and restarts the app on
mobile.

## Imports

This tool imports no `@devtools/*` package. Every other `@devtools/*` import is forbidden, see
[devtools-import-boundary](../../.agents/skills/devtools-import-boundary/SKILL.md).

# @devtools/app-config

The App config DevTool. Shows once the default option of the build, which every switch without a
saved option uses, then lists each switch the host declares with
[`@shared/app-config`](../../shared/app-config/README.md): its options and their values, the one
this session runs on and, when it differs, the one saved for the next session. Selecting an option
saves its id right away, and selecting the default removes the saved option instead, so the switch
follows the default again. Neither reloads: the configuration is resolved once per
session, and a reload can be slow under a debugger or on an emulator, so the Reload button (Restart
on mobile) applies every saved change at once. It only appears, with the number of changes, while a saved
option differs from the current one.

A search bar matches the switches by label, id or value name, and the All / Switched filter keeps
only the switches that run, or will run, on another option than the default. Both stay at the top
of the list and scroll with it.

The tool never writes a value: it hands option ids to the host, which saves them.

## Props contract

```ts
interface AppConfigToolProps {
  defaultOptionId: ConfigOptionId | undefined;
  switches: readonly ConfigSwitchState[];
  onSelectOption: (switchId: string, optionId: ConfigOptionId) => void;
  onResetSwitch: (switchId: string) => void;
  onReloadApp: () => void;
}
```

`useAppConfigToolProps()` from `@devtools/bindings` builds them from the `appConfig` slice of the
store, and dispatches `selectAppConfigOption`, `resetAppConfigSwitch` or `reloadAppConfig` from
`@shared/app-config`. The app-config middleware saves each selection, and on reload reloads the
renderer on desktop and restarts the app on mobile.

## Imports

This tool imports no `@devtools/*` package. Every other `@devtools/*` import is forbidden, see
[devtools-import-boundary](../../.agents/skills/devtools-import-boundary/SKILL.md).

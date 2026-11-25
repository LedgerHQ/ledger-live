# @features/flow-settings-security

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The Security section of the new Settings of Ledger Wallet mobile and desktop (Settings 4.0), shown
behind the `newSettings` feature flag. Both apps share the same rows, rules and wording; only the
rendering differs. The legacy Settings stay in the apps, untouched, until the flag reaches 100%.

Part of the [Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813), built on the
shell package `@features/flow-settings`.

## Rows

| Row              | Platform | Shown when                       | Value and change                                     |
| ---------------- | -------- | -------------------------------- | ---------------------------------------------------- |
| Hide balance     | both     | always                           | `hideBalance`, the discreet mode                     |
| App lock         | both     | always                           | Shows whether a password is set, asks the app to start the set or remove flow |
| Change password  | desktop  | a password is set                | Asks the app to start the change flow                |
| Auto-lock        | desktop  | a password is set                | `autoLockTimeout`, in minutes, `-1` for never        |
| Biometrics       | mobile   | the device has biometrics        | Disabled while no password is set; wording follows the device (Face ID, Touch ID, Biometrics). The mobile screen comes with its own task |
| MEV protection   | both     | always                           | `mevProtection`, with a link to the MEV protection page |

## Exports

| Export                        | Purpose                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `Security`                    | The section, to render in the Settings page                          |
| `getSecurityRows`             | Rows to show for a platform and a state                              |
| `getAppLockAction`            | `set`, `change` or `remove` for a press on App lock                  |
| `applySecurityUpdate`         | Runs the side effect of one change, one call per setting             |
| `isSecurityUpdate`            | Tells whether a change of the settings port belongs to this section  |
| `useSecuritySettingsLabels`   | Wording of the section                                               |
| `SecuritySettingsPort`        | What the app provides: values, `setValue`, `requestAppLock`, `openMevProtectionInfo` |
| `SecuritySideEffects`         | What a change does in the app, one method per setting                |

## How an app uses it

The app provides one settings port to `SettingsPortProvider` of `@features/flow-settings`, with the
values and changes of every section it shows plus the actions of this one. It builds the part of
this section from its own store, and sends each change to `applySecurityUpdate`, so the package
decides what a change does and the app only dispatches. The package never imports the app store.

Desktop: `apps/ledger-live-desktop/src/mvvm/features/Settings/sections/security.ts`, composed in
`useDesktopSettingsPort`. The password flows stay the app's: `requestAppLock` opens the legacy
modals.

## Tracking

The events of the legacy screens are kept: `button_clicked` for the discreet mode, `toggle_clicked`
for MEV protection, and the `PasswordEnabled`, `PasswordDisabled`, `mev_activated` and
`mev_disactivated` events when the state changes.

## Consumers

Ledger Wallet Desktop. Ledger Wallet Mobile once its Security screen lands.

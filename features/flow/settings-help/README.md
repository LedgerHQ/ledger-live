# @features/flow-settings-help

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The Help page of the new Settings of Ledger Wallet desktop (Settings 4.0), shown behind the
`newSettings` feature flag. It is a standalone page, opened from the profile Help button at
`/settings/help`, not a tab of the Settings page. The legacy Settings stay in the app, untouched,
until the flag reaches 100%.

Part of the [Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813), built on the
shell package `@features/flow-settings`. Web only for now: mobile keeps its own Help screen.

## Rows

| Group               | Row                  | What it does                                                                                 |
| ------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| Support and learning | Ledger support       | Opens the chatbot when `lldChatbotSupport` or `llmChatbotSupport` is on, the FAQ otherwise    |
| Support and learning | Ledger Academy       | Opens the Academy page                                                                       |
| More                | Save logs            | The app's export, rendered through a slot                                                    |
| More                | Ledger status        | Opens the status page                                                                        |
| More                | Clear cache          | Asks for a confirmation, then clears the cache                                               |
| More                | View user data       | Opens the user data folder                                                                   |
| More                | Repair device        | The app's repair flow, rendered through a slot                                               |
| More                | Device setup         | Launches the onboarding                                                                      |
| More                | Reset                | Asks for a confirmation, then erases the local data                                          |

Clear cache and Reset use the destructive confirmation of `@features/flow-settings`. A failure
of either is the app's to handle: the port resolves once it has opened its fallback.

## Exports

| Export             | Purpose                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `HelpPage`         | The page: `port`, `slots`, and `whileConfirming`                                 |
| `HelpPort`         | What the app provides: the three links and the actions only the app can run      |
| `HelpSlots`        | Rows the app renders itself, because they run a legacy component with its modal  |
| `HELP_ITEM_IDS` and the types of `logic/helpItems` | The rows and their groups                        |

`whileConfirming` is rendered while a confirmation is open. Desktop uses it to pause the sync, as
the legacy confirmation did.

## How an app uses it

The app builds a `HelpPort` from its own hooks and renders `HelpPage` as the standalone page of
`SettingsGate`, through its `renderStandalonePage`. The package never imports the app store.

Desktop: `apps/ledger-live-desktop/src/mvvm/features/Settings/sections/help.tsx`.

## Tracking

The events of the legacy buttons are kept, sent when the button is pressed: `ClearCacheIntent`,
`View user data`, `HardResetIntent`, and `Launch Onboarding from Settings`. The screens
`Settings Help`, and `Modal CleanCache` or `Modal HardReset` while a confirmation is open, are
tracked too. `ExportLogs` is sent by the app, which renders that row.

## Consumers

Ledger Wallet Desktop.

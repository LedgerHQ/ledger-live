# @features/flow-settings-help

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The Help page of Ledger Wallet, on desktop and mobile. Both apps share the logic; only the rows,
the wording keys, the tracking and the rendering differ.

- Desktop: the Help page of the new Settings (Settings 4.0), shown behind the `newSettings`
  feature flag. It is a standalone page, opened from the profile Help button at `/settings/help`,
  not a tab of the Settings page. The legacy Settings stay in the app, untouched, until the flag
  reaches 100%.
- Mobile: the My Wallet Help screen, opened from the Help quick action of My Wallet. No flag.

Part of the [Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813), built on the
shell package `@features/flow-settings`.

## Rows

| Group                | Row            | Apps            | What it does                                                                     |
| -------------------- | -------------- | --------------- | -------------------------------------------------------------------------------- |
| Support and learning | Ledger support | desktop, mobile | Opens the chatbot when the app's chatbot flag is on, the FAQ otherwise           |
| Support and learning | Ledger Academy | desktop, mobile | Opens the Academy page                                                           |
| More                 | Save logs      | desktop, mobile | Desktop renders its export through a slot; mobile saves through `port.saveLogs`  |
| More                 | Ledger status  | desktop, mobile | Opens the status page                                                            |
| More                 | Clear cache    | desktop, mobile | Asks for a confirmation, then clears the cache                                   |
| More                 | View user data | desktop         | Opens the user data folder                                                       |
| More                 | Repair device  | desktop         | The app's repair flow, rendered through a slot                                   |
| More                 | Device setup   | desktop         | Launches the onboarding                                                          |
| More                 | Reset          | desktop         | Asks for a confirmation, then erases the local data                              |

Clear cache and Reset use the confirmation of `@features/flow-settings`: destructive on desktop,
neutral for Clear cache on mobile, as My Wallet Help always asked. A failure of either is the app's
to handle: the port resolves once it has opened its fallback.

On mobile, the support row is named "Ledger Chatbot" when `supportOpensChatbot` is on.

## Wording

Each app keeps its translated keys: `copy/useHelpLabels.web.ts` reads the legacy desktop keys,
`copy/useHelpLabels.native.ts` the `myWallet.help` keys of mobile.

## Exports

| Export                                             | Purpose                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `HelpPage`                                         | The page: `port`, desktop `slots`, and `whileConfirming`                        |
| `HelpPort`                                         | `DesktopHelpPort` or `MobileHelpPort`, told apart by `platform`                 |
| `HelpSlots`                                        | Desktop rows the app renders itself, because they run a legacy component        |
| `HELP_ITEM_IDS` and the types of `logic/helpItems` | The rows and their groups                                                       |

`whileConfirming` is rendered while a confirmation is open. Desktop uses it to pause the sync, as
the legacy confirmation did.

## How an app uses it

The app builds its port from its own hooks and renders `HelpPage`. The package never imports the
app store.

- Desktop renders it as the standalone page of `SettingsGate`, through its `renderStandalonePage`:
  `apps/ledger-live-desktop/src/mvvm/features/Settings/sections/help.tsx`.
- Mobile renders it as the My Wallet Help screen, whose navigator header shows the title:
  `apps/ledger-live-mobile/src/mvvm/features/MyWallet/screens/Help`.

## Tracking

Desktop keeps the events of the legacy buttons, sent when the button is pressed:
`ClearCacheIntent`, `View user data`, `HardResetIntent`, and `Launch Onboarding from Settings`.
The screens
`Settings Help`, and `Modal CleanCache` or `Modal HardReset` while a confirmation is open, are
tracked too. `ExportLogs` is sent by the app, which renders that row.

Mobile keeps the events of My Wallet Help: the screen `My Wallet Help`, and `button_clicked` with
`page: "Help"` and `button` set to `LedgerSupport`, `LedgerAcademy`, `SaveLogs`, `LedgerStatus` or
`ClearCache` when a row is pressed.

## Consumers

Ledger Wallet Desktop and Ledger Wallet Mobile.

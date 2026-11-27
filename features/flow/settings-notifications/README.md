# @features/flow-settings-notifications

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The Notifications section of the new Settings of Ledger Wallet mobile (Settings 4.0), shown behind
the `newSettings` feature flag. Mobile only. The legacy Notifications screen stays in the app,
untouched, until the flag reaches 100%.

Part of the [Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813), built on the
shell package `@features/flow-settings`. The toggles and their effects are the legacy ones; only
the look and the banner change.

## Rows

In the order of the design. Each row is a toggle on one value of the app's notification preferences.

| Row                    | Key                          | Shown when                                                        |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------- |
| Allow notifications    | `areNotificationsAllowed`    | always                                                            |
| Announcements          | `announcementsCategory`      | not hidden remotely                                               |
| Total market cap       | `totalMarketCap`             | not hidden remotely                                               |
| Price alerts           | `largeMoverCategory`         | not hidden remotely                                               |
| Top gainers and losers | `topGainersLosers`           | not hidden remotely                                               |
| Transaction alerts     | `transactionsAlertsCategory` | not hidden remotely while the `transactionsAlerts` feature is on  |

Every toggle is disabled while the phone blocks notifications, and a banner offers to turn them
on. The categories are also disabled while Allow notifications is off.

## Exports

| Export                              | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `NotificationsSettings`             | The section, to render in the Notifications screen of the new Settings  |
| `useNotificationsSettingsPort`      | The Notifications part of the port given to `SettingsPortProvider`      |
| `NotificationsSettingsPort`         | What the app provides: values, `setValue`, `requestOsPermission`        |
| `applyNotificationUpdate`           | Runs one toggle change through the app's `NotificationsSideEffects`     |
| `getHiddenNotificationCategories`   | Turns the remote categories config into the categories to hide          |
| `getNotificationsRows`              | Rows to show, with their value and whether they are disabled            |
| `useNotificationsSettingsLabels`    | Wording of the section                                                  |

## How the app uses it

The app provides the port to `SettingsPortProvider` of `@features/flow-settings`, like every
section, and the section reads it with `useSettingsPort`. The app builds the port from its own
store and sends each change to `applyNotificationUpdate` with its side effects: store the value, mark the user as opted in or out when Allow notifications
changes, identify, and send the preferences to the marketing tool. The package never imports the
app store.

Mobile: `apps/ledger-live-mobile/src/mvvm/features/Settings/sections/notifications.ts`.

## Tracking

The events of the legacy screen are kept: the `Settings` / `Notifications` page,
`toggle_clicked` with the legacy `Toggle_*` names, and, sent by the app, `button_clicked` with
`Go to system settings` for the banner action.

## Consumers

Ledger Wallet Mobile.

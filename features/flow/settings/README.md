# @features/flow-settings

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The new Settings of Ledger Wallet mobile and desktop (Settings 4.0), shown behind the `newSettings`
feature flag. Both apps share the same sections, rows and wording; only the rendering differs. The
legacy Settings stay in the apps, untouched, until the flag reaches 100%.

The sections come with the next tickets of the
[Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813).

## Page and rows

| Export                   | Entry  | Purpose                                                                 |
| ------------------------ | ------ | ----------------------------------------------------------------------- |
| `SettingsPage`           | `/web` | Desktop page: title and one tab per section; the app renders the content |
| `SettingsSection`        | `.`    | Block of rows with an optional title                                    |
| `SettingsRow`            | `.`    | Icon, title, description with an optional link, and a trailing element  |
| `SETTINGS_SECTIONS`      | `.`    | General, Asset management, Security, Privacy, About                     |
| `resolveSettingsSection` | `.`    | Turns an address segment into a section, General when unknown           |
| `useSettingsLabels`      | `.`    | Page title and section names                                            |

A row's trailing element is a chevron, an external link, a toggle, a value, a select or a button.
On mobile, the select shows the current value; the picker comes with the mobile screens.

## Sheets

A sheet opens on top of the Settings: a bottom sheet on mobile, a dialog on desktop.

| Export                 | Entry | Purpose                                                                 |
| ---------------------- | ----- | ----------------------------------------------------------------------- |
| `SettingsSheet`        | `.`   | Title, optional description, close button and any content               |
| `SettingsConfirmSheet` | `.`   | Confirm or cancel an action, `destructive` or `neutral`, disabled while it runs |

| `SettingsOptionList`   | `.`   | Options with an optional icon and code, a check on the current one, optional search |

The search of `SettingsOptionList` matches the label and the code, ignoring case and accents. Put
the list in a `SettingsSheet` for Theme, Language, Region or Currency.

On mobile, `SettingsSheet` goes through `QueuedBottomSheet`, so the app must render it under
`QueuedBottomSheetsProvider` like any queued sheet.

## Hiding rows

The app decides which rows to hide and passes the list to the new Settings. Apollo is the first
use: on that device the app hides `myLedgerProvider` and `mockAppUpdate`.

Wrap the Settings in `HiddenSettingsProvider` with that list: a `SettingsRow` whose `settingId`
is in it is not rendered.

| Export              | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `SETTING_IDS`       | Closed list of the rows that can be hidden                               |
| `SettingId`         | One of `SETTING_IDS`                                                     |
| `isSettingId`       | Tells whether a value is a known row id                                  |
| `getHiddenSettings` | Turns the list given by the app into the set of rows to hide             |

`getHiddenSettings` never throws: a missing list, a value that is not a list, an unknown id or a
duplicate is ignored.

A row id is the English label of the row in camelCase, e.g. "My Ledger provider" gives
`myLedgerProvider`. Add the id to `SETTING_IDS` when a row needs to be hidden.

## Consumers

Ledger Wallet Desktop and Ledger Wallet Mobile.

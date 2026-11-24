# @features/flow-settings

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The new Settings of Ledger Wallet mobile and desktop (Settings 4.0), shown behind the `newSettings`
feature flag. Both apps share the same sections, rows and wording; only the rendering differs. The
legacy Settings stay in the apps, untouched, until the flag reaches 100%.

The sections come with the next tickets of the
[Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813).

## Sections

| Export                   | Entry | Purpose                                                       |
| ------------------------ | ----- | ------------------------------------------------------------- |
| `SettingsSection`        | `.`   | Block of rows with an optional title                          |
| `SettingsRow`            | `.`   | Icon, title, description with an optional link, and a trailing element |
| `SETTINGS_SECTIONS`      | `.`   | General, Asset management, Security, Privacy, About           |
| `resolveSettingsSection` | `.`   | Turns an address segment into a section, General when unknown |
| `useSettingsLabels`      | `.`   | Page title and section names                                  |

A row's trailing element is a chevron, an external link, a toggle, a value, a select or a button.
On mobile, the select opens its options in a bottom sheet (Lumen `SelectList`), like the web
select opens its list: render the Settings under `QueuedBottomSheetsProvider`.

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

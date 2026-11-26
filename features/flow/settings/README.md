# @features/flow-settings

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The new Settings of Ledger Wallet mobile and desktop (Settings 4.0), shown behind the `newSettings`
feature flag. Both apps share the same sections, rows and wording; only the rendering differs. The
legacy Settings stay in the apps, untouched, until the flag reaches 100%.

The sections come with the next tickets of the
[Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813).

## Page and rows

| Export                     | Entry     | Purpose                                                                                        |
| -------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `SettingsPage`             | `/web`    | Desktop page: title and one tab per section; the app renders the content                       |
| `SettingsGate`             | `/web`    | New page behind `newSettings`, legacy Settings otherwise and for Experimental, Developer       |
| `SettingsSection`          | `.`       | Block of rows with an optional title                                                           |
| `SettingsRow`              | `.`       | Icon, title, description with an optional link, and a trailing element                         |
| `SETTINGS_SECTIONS`        | `.`       | General, Asset management, Security, Privacy, About                                            |
| `resolveSettingsSection`   | `.`       | Turns an address segment into a section, General when unknown                                  |
| `SETTINGS_HOME_SECTIONS`   | `.`       | Mobile home sections: the desktop ones plus Notifications                                      |
| `useSettingsLabels`        | `.`       | Page title and section names                                                                   |
| `SettingsHome`             | `/native` | Mobile home: one row per section, then the Developer and Debug rows the app gives (`devTools`) |
| `SettingsHomeGate`         | `/native` | New home behind `newSettings` (tracks `Page Settings`), legacy home otherwise                  |
| `useIsSettingsHomeEnabled` | `/native` | Whether the new home is on, for the header the app's navigator sets                            |
| `SettingsScrollView`       | `/native` | Scroll view of a Settings screen, its content padded off the bottom safe area                  |

Help is a standalone page, not a section: with `newSettings` on, `getSettingsRoute` returns
`standalonePage: "help"` for `/settings/help`, and `SettingsGate` renders what the app's
`renderStandalonePage` gives, without the section tabs. It is the page of
`@features/flow-settings-help`.

A row's trailing element is a chevron, an external link, a toggle, a value, a select or a button.
On mobile, the select opens its options in a bottom sheet (Lumen `SelectList`), like the web
select opens its list: render the Settings under `QueuedBottomSheetsProvider`.

## Sheets

A sheet opens on top of the Settings: a bottom sheet on mobile, a dialog on desktop.

| Export                 | Entry | Purpose                                                                 |
| ---------------------- | ----- | ----------------------------------------------------------------------- |
| `SettingsSheet`        | `.`   | Title, optional description, close button and any content               |
| `SettingsConfirmSheet` | `.`   | Confirm or cancel an action, `destructive` or `neutral`, disabled while it runs; an `InfoState` dialog on desktop |

On mobile, `SettingsSheet` goes through `QueuedBottomSheet`, so the app must render it under
`QueuedBottomSheetsProvider` like any queued sheet.

## Hiding rows

The app decides which rows to hide and passes the list to the new Settings. Apollo is the first
use: on Apollo, `myLedgerProvider` and `mockAppUpdate` are always hidden. Firebase cannot target
Apollo, so the app tells whether it runs on Apollo, and while `newSettings` is on, its params can
also hide each row by hand on any device.

| `newSettings` param    | Default | Row hidden while `true`, or always on Apollo |
| ---------------------- | ------- | -------------------------------------------- |
| `hideMyLedgerProvider` | `false` | `myLedgerProvider`                           |
| `hideMockAppUpdate`    | `false` | `mockAppUpdate`                              |

Off Apollo, the params count only while the flag is on, and a flag served without params hides
nothing. Firebase value of `feature_new_settings` that hides both rows on every device:

```json
{ "enabled": true, "params": { "hideMyLedgerProvider": true, "hideMockAppUpdate": true } }
```

`useApolloHiddenSettings(isApollo)` returns that list.

Wrap the Settings in `HiddenSettingsProvider` with that list: a `SettingsRow` whose `settingId`
is in it is not rendered.

| Export                    | Purpose                                                      |
| ------------------------- | ------------------------------------------------------------ |
| `SETTING_IDS`             | Closed list of the rows that can be hidden                   |
| `SettingId`               | One of `SETTING_IDS`                                         |
| `isSettingId`             | Tells whether a value is a known row id                      |
| `getHiddenSettings`       | Turns the list given by the app into the set of rows to hide |
| `useApolloHiddenSettings` | Rows to hide: all on Apollo, or those the params turn on     |

`getHiddenSettings` never throws: a missing list, a value that is not a list, an unknown id or a
duplicate is ignored.

A row id is the English label of the row in camelCase, e.g. "My Ledger provider" gives
`myLedgerProvider`. Add the id to `SETTING_IDS` when a row needs to be hidden.

## Settings values

A section reads and changes settings through a port the app provides. The package never imports
the app store, and a value can move out of the app later without the sections changing.

| Export                   | Purpose                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `SettingsPortProvider`   | Gives the sections a `SettingsPort`; the app mounts it with a memoized value |
| `useSetting(key)`        | Current value of a setting, re-rendered when the app changes it           |
| `useUpdateSetting()`     | Returns `setValue({ key, value })`, which applies the change and its side effects |
| `useSettingsPort<Port>()` | The port typed for a section living in its own package, which names its own values and updates |
| `SettingsValues`         | Type of every setting, composed from one file per section under `src/ports/sections/` |

The app builds the port from its own store. `values` is a snapshot read with the app's selectors,
so the sections re-render on change. Each app maps every key to its legacy selector and action.

`theme` is the first key and shows the pattern. Each section adds its keys when it lands: its values
in `src/ports/sections/<section>.ts`, a handler in each app, and a row in the table below.

| Key     | Value                           | Side effects of a change                           |
| ------- | ------------------------------- | -------------------------------------------------- |
| `theme` | `"system" \| "light" \| "dark"` | Stored only. Desktop stores `null` for `"system"`. |

Side effects that need the app stay in the app: desktop main-process IPC, native modules and app
restart. The tracking events of a screen stay in its view.

## Sections in their own package

Each section after General is a flow package of its own, for example `@features/flow-settings-security`. It
declares its values and updates, and takes the shell's `SettingsPort<Values, Update>` as its port type. The
shell imports no section: the app composes them. It gives `SettingsGate` a `renderSection` function that
returns the content of a section, and provides one port that carries the values and changes of every section
(see `createFakePort` in `@features/flow-settings/testing` for the tests of a section).

## Consumers

Ledger Wallet Desktop and Ledger Wallet Mobile.

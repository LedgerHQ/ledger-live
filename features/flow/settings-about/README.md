# @features/flow-settings-about

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The About section of the new Settings of Ledger Wallet mobile and desktop (Settings 4.0), shown
behind the `newSettings` feature flag. Both apps share the same rows, rules and wording; only the
rendering differs. The legacy Settings stay in the apps, untouched, until the flag reaches 100%.

Part of the [Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813), built on the
shell package `@features/flow-settings`. Desktop renders it; mobile does not render it yet.

## Rows

| Section         | Row                    | What it does                                           |
| --------------- | ---------------------- | ------------------------------------------------------ |
| (none)          | Version                | Shows the app version; 5 taps unlock Developer tools   |
| (none)          | Terms and conditions   | Opens the localized terms page                         |
| Connect with us | X, Instagram, GitHub   | Opens the link                                         |

There is no release notes button, no Privacy policy row and no feedback row on desktop.

## Port

The app provides a `SettingsAboutPort`: `version`, `links` (terms, X, Instagram, GitHub) and
`unlockDeveloperTools()`. The package never imports the app store.

The unlock is called once, on the fifth tap of the Version row. Desktop sets `developerMode`, as
the legacy About does, and shows its toast. The setting is saved to disk, so it survives a restart.

## Exports

| Export               | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `SettingsAbout`      | The section: `port` and `testID`             |
| `SettingsAboutPort`  | What the app provides (type)                 |

## Tracking

The app tracks the screen: desktop sends `Settings` / `About`.

## Consumers

Ledger Wallet Desktop, in `apps/ledger-live-desktop/src/mvvm/features/Settings/sections/about.tsx`.
Ledger Wallet Mobile, once its About screen lands.

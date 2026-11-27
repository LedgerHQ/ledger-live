# @features/flow-settings-about

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The About section of the new Settings of Ledger Wallet mobile and desktop (Settings 4.0), shown
behind the `newSettings` feature flag. Both apps share the same rows, rules and wording; only the
rendering differs. The legacy Settings stay in the apps, untouched, until the flag reaches 100%.

Part of the [Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813), built on the
shell package `@features/flow-settings`. Desktop and mobile render it.

## Rows

| Section         | Row                    | What it does                                                        |
| --------------- | ---------------------- | ------------------------------------------------------------------- |
| (none)          | Version                | Shows the app version; 5 taps unlock Developer tools                |
| (none)          | Terms and conditions   | Opens the localized terms page                                      |
| Connect with us | Give us feedback on the app | Opens the in-app feedback flow; mobile only, when the app provides it |
| Connect with us | Rate us on {store}     | Opens the store page to rate the app; mobile only, when the app gives `storeReview` |
| Connect with us | X, Instagram, GitHub   | Opens the link                                                      |

There is no release notes button and no Privacy policy row. The feedback row is shown only when
the app provides `feedback`, so desktop has none.

## Port

The app provides a `SettingsAboutPort`:

- `version`, and `termsUrl` (the localized terms page);
- `unlockDeveloperTools()`, called once on the fifth tap of the Version row;
- optional `feedback()`, which opens the feedback flow and shows the feedback row when set;
- optional `storeReview` (`{ url, storeName }`), the store page for the rate row and its name (App
  Store on iOS, Play Store on Android), shown when set;
- optional `onRowSelect(rowId)`, called with the id of each row the user selects, so the app can
  track it.

The package never imports the app store. Its social links (X, Instagram, GitHub) live in the
package's own `src/urls.ts`, an internal file like the other flows' `urls.ts`, so the app does not
carry them.

Desktop sets `developerMode` on the unlock, as the legacy About does, and shows its toast. The
setting is saved to disk, so it survives a restart. Mobile opens its in-memory Debug menu instead,
so the unlock lasts until the app is killed.

## Exports

| Export               | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `SettingsAbout`      | The section: `port` and `testID`             |
| `SettingsAboutPort`  | What the app provides (type)                 |

## Tracking

The app tracks the screen: desktop sends `Settings` / `About`, mobile does too.

Row tracking is the app's job: `onRowSelect` reports each selected row, and mobile maps the version
and terms rows to the legacy `AppVersionRow` and `TermsConditionsRow` events. The feedback row
tracks itself through the ratings flow.

## Consumers

- Ledger Wallet Desktop, in `apps/ledger-live-desktop/src/mvvm/features/Settings/sections/about.tsx`.
- Ledger Wallet Mobile, in `apps/ledger-live-mobile/src/mvvm/features/Settings/sections/about/`.

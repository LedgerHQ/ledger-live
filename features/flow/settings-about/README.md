# @features/flow-settings-about

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The About section of the new Settings of Ledger Wallet mobile and desktop (Settings 4.0), shown
behind the `newSettings` feature flag. Both apps share the same rows, rules and wording; only the
rendering differs. The legacy Settings stay in the apps, untouched, until the flag reaches 100%.

Part of the [Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813), built on the
shell package `@features/flow-settings`. This is a skeleton: the section renders no row yet.

## Exports

| Export              | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `SettingsAbout` | The section, to render in the Settings page     |

## Consumers

Ledger Wallet Desktop and Ledger Wallet Mobile, once the section is wired in.

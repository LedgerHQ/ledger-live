# @features/flow-settings-general

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The General section of the new Settings of Ledger Wallet mobile and desktop: Ledger Sync, theme, language, currency, plus Region on desktop. It reads and changes its settings through the port the app gives to `@features/flow-settings` (`SettingsPortProvider`), and never imports the apps' stores.

## Screens

| Entry      | Export    | Purpose                                                                                     |
| ---------- | --------- | ------------------------------------------------------------------------------------------- |
| `/web`     | `General` | Desktop tab: Ledger Sync button, theme, language and currency selects, region dialog        |
| `/native`  | `General` | Mobile screen: rows showing their value, each opening a sheet; Ledger Sync opens its flow    |

The app renders `General` for the `general` section (`renderSection` on desktop, the section screen
on mobile), inside the `SettingsPortProvider` that carries the General port.

## Port

| Export                                          | Purpose                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `GeneralSettingsPort` / `useGeneralSettingsPort` | `theme`, `language`, `currency`, and what only the app knows: `languages`, `currencies`, `ledgerSync` |
| `RegionSettingsPort` / `useRegionSettingsPort`   | `region`, the locale of the formats (e.g. `"fr-FR"`). Desktop only                          |

| Key        | Value                             | Side effects of a change                                                    |
| ---------- | --------------------------------- | --------------------------------------------------------------------------- |
| `theme`    | `"system" \| "light" \| "dark"`   | Stored only. Desktop stores `null` for `"system"`.                          |
| `language` | App language id, e.g. `"fr"`      | UI language switches. Desktop offers to install it on the last seen device. |
| `currency` | Countervalue ticker, e.g. `"EUR"` | Stored as the countervalue id (ticker for a fiat, id for a crypto).         |
| `region`   | Locale, e.g. `"fr-FR"`            | Formats follow. A sanctioned locale is stored as `"en-US"`.                 |

## Logic

The package decides what a change does; each app only gives the side effects on its store.

| Export                       | Purpose                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `applyGeneralSettingUpdate`  | Runs a General change on the app's `GeneralSideEffects`; ignores an unlisted language or currency |
| `shouldOfferDeviceLanguage`  | Whether to offer the picked language on the last seen device                  |
| `applyRegionUpdate`          | Runs a Region change, storing a sanctioned locale as `"en-US"`                |
| `getRegionChoices(language)` | Regions a user can pick, sanctioned ones left out, named in the app language  |
| `REGION_LOCALES` / `isRegionLocale` | Every locale the app can format dates and numbers in |
| `SANCTIONED_REGION_LOCALES` / `toAllowedRegionLocale` | Sanctioned locales, never offered and stored as `"en-US"` |

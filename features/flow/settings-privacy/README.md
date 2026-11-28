# @features/flow-settings-privacy

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The Privacy section of the new Settings of Ledger Wallet mobile and desktop (Settings 4.0), shown
behind the `newSettings` feature flag. Both apps share the same rows, rules and wording; only the
rendering differs. The legacy Settings stay in the apps, untouched, until the flag reaches 100%.

Part of the [Settings 4.0 epic](https://ledgerhq.atlassian.net/browse/LIVE-41813), built on the
shell package `@features/flow-settings`.

## Rows

| Row                     | Shown when                         | Value and change                                                  |
| ----------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Bug reports             | always                             | `bugReports`                                                      |
| App performance         | `separateAnalyticsConsents`        | `analytics`                                                       |
| Personalized experience | `separateAnalyticsConsents`        | `personalizedRecommendations`                                     |
| Analytics               | not `separateAnalyticsConsents`    | On while both consents are given; a change sets both (`analyticsAndRecommendations`) |
| Privacy policy          | always                             | Opens the localized privacy policy, one URL per platform          |

Desktop sets `separateAnalyticsConsents` from the `lldAnalyticsOptInPrompt` flag, as the legacy
General screen does. Mobile always has separate consents.

## Exports

| Export                     | Purpose                                                                |
| -------------------------- | ---------------------------------------------------------------------- |
| `Privacy`                  | The section, to render in the Settings page                            |
| `getPrivacyRowIds`         | Rows to show for a state                                               |
| `getPrivacyToggleValue`    | Value of a toggle row                                                  |
| `toPrivacyUpdate`          | Change a toggle row sends                                              |
| `applyPrivacyUpdate`       | Runs the side effect of one change, one call per change                |
| `isPrivacyUpdate`          | Tells whether a change of the settings port belongs to this section    |
| `usePrivacySettingsLabels` | Wording of the section                                                 |
| `PrivacySettingsPort`      | What the app provides: values and `setValue`                           |
| `PrivacySideEffects`       | What a change does in the app, one method per change                   |

## How an app uses it

The app provides one settings port to `SettingsPortProvider` of `@features/flow-settings`, with the
values and changes of every section it shows. It builds the part of this section from its own
store, and sends each change to `applyPrivacyUpdate`, so the package decides what a change does and
the app only dispatches. The analytics side effects also refresh the analytics identity, as the
legacy toggles do. The package never imports the app store.

Desktop: `apps/ledger-live-desktop/src/mvvm/features/Settings/sections/privacy.ts`, composed in
`useDesktopSettingsPort`.

## Tracking

The events of the legacy screens are kept, per platform:

| Event                                                        | Desktop                                      | Mobile                                  |
| ------------------------------------------------------------ | -------------------------------------------- | --------------------------------------- |
| `toggle_clicked`, mandatory, on App performance              | `toggle: "Analytics"`, `page: "settings general"` | `toggle: "Analytics"`, `page: "Page Settings General"` |
| `toggle_clicked`, mandatory, on Personalized experience      | `toggle: "personalised recommendations"`     | `toggle: "Recommendations"`             |
| Bug reports state                                            | `ReportBugsEnabled` / `ReportBugsDisabled`   | `EnableReportBug` / `DisableReportBug`  |
| Personalized recommendations state                           | —                                            | `EnablePersonalizedRecommendations` / `DisablePersonalizedRecommendations` |
| Analytics state, mandatory, shared toggle only               | `AnalyticsEnabled` / `AnalyticsDisabled`     | —                                       |

State events are sent each time the state changes, not on mount. Desktop also sends `OpenURL`
for the privacy policy, through its linking provider.

## Consumers

Ledger Wallet Desktop. Ledger Wallet Mobile comes with
[LIVE-41839](https://ledgerhq.atlassian.net/browse/LIVE-41839).

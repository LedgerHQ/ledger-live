# `@features/platform-content-ab-tests`

> [!CAUTION]
> **Status: UNSTABLE** — New package; the public API may still change.

English copy experiments. The package reads `feature_copy_*` values from a Remote Config `getAll()` payload the app already fetched for feature flags, stores them, and installs them as runtime overrides on the English i18n baseline.

It does not decide whether a feature flag is on. That stays in `@features/platform-feature-flags`. `RemoteConfigValue` comes from `@features/platform-feature-flags-firebase`.

## Exports

| Export | Behaviour |
| --- | --- |
| `setContentAbTestCopy(all)` | Stores experiments from one `getAll()` payload. An identical poll does not republish. |
| `getContentAbTestCopy()` / `subscribeToContentAbTestCopy` | The English copy currently applied: the `copy` of enabled experiments. |
| `getContentAbTestTracking()` | The `trackingConfiguration` of each enabled experiment, keyed by in-app id (`feature_copy_upgrade_banner` becomes `upgradeBanner`). `undefined` when there is none. Apps send it as the `ab_tests` analytics attribute and omit the attribute when it is `undefined`. |
| `getContentAbTests()` / `subscribeToContentAbTests` | Every valid experiment, enabled or not, with debug overrides applied. Used by the feature flags debug screens. |
| `setContentAbTestOverride` / `clearContentAbTestOverrides` | Local debug overrides. They replace the remote payload, so they change the applied copy and `ab_tests` too, and survive later polls. |
| `parseContentAbTestPayload(value)` | Validates one payload with the same rules as Remote Config values. Returns `null` when invalid. |
| `installContentAbTestCopyOverrides` | Applies the stored copy to an i18n instance. English only; keys missing from the English baseline are skipped. |

## Payload

```json
{
  "enabled": true,
  "copy": { "upgrade.banner.title": "Discover Ledger Flex" },
  "trackingConfiguration": { "ab_upgrade": "variant_b", "cohort": "q3" }
}
```

For `feature_copy_upgrade_banner`, events carry `ab_tests: { upgradeBanner: { ab_upgrade: "variant_b", cohort: "q3" } }`. `trackingConfiguration` is optional and takes any keys, with string values only. A non-string value makes the whole experiment invalid, so its copy is not applied either.

## When a new value takes effect

Experiments update during the session, not on the next launch. At boot the apps hydrate the store from the config Firebase kept on disk, then from each Remote Config poll (every 5 minutes). This keeps a kill switch: a bad copy can be turned off without waiting for users to restart the app.

Copy and `ab_tests` can briefly disagree after a poll changes an experiment:

- `ab_tests` is read on every analytics event, so events sent after the poll carry the new payload.
- The copy is written to i18n silently, so a screen that is already mounted keeps the old text until it re-renders. A new mount shows the new copy.

This only happens while an experiment is started, stopped or edited, and only for users with the affected screen on display at that moment. Exclude those transition windows when analysing results.

If that gap ever matters, re-render on copy changes instead of freezing experiments per session: subscribe to `subscribeToContentAbTestCopy` and emit an event react-i18next listens to. Check what else listens to that event in each app first.

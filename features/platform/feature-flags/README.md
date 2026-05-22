# `@features/platform-feature-flags`

Redux-backed React hooks for resolved feature flags. Drop-in replacement for the
Context-based hooks exported from `@ledgerhq/live-common/featureFlags`.

Reads from the `featureFlags` slice provided by `@shared/feature-flags`. Both
`ledger-live-desktop` and `ledger-live-mobile` already register that slice in
their root reducer.

## Exports

| Hook / component                          | Behaviour                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `useFeature(key)`                         | Resolved value for a single flag (typed via Zod-derived `Features[K]`). |
| `useFeatureFlags()`                       | Whole resolved map.                                                     |
| `useHasLocallyOverriddenFeatureFlags()`   | `true` if any local override is active (`state.featureFlags.overrides` is non-empty). |
| `<FeatureToggle featureId fallback>`      | Renders `children` when the flag is enabled, otherwise `fallback`.      |
| `useWalletFeaturesConfig(platform)`       | Boolean config object derived from `lwdWallet40` / `lwmWallet40`.       |

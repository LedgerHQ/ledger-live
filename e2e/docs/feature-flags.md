# E2E feature flags

Set `E2E_FEATURE_FLAGS_JSON` to inject feature flags for a Desktop or Mobile run. The value is a JSON object of flag keys. An empty value is ignored. Arrays, scalars, `null`, and invalid JSON are rejected.

```bash
export E2E_FEATURE_FLAGS_JSON='{"myFeature":{"enabled":true,"params":{"foo":"bar"}}}'
```

Feature flags apply in this order. A later layer replaces the same key:

1. Built-in E2E defaults.
2. The preset from `E2E_DESKTOP_FEATURE_FLAGS` or `E2E_MOBILE_FEATURE_FLAGS` (if set), see [Desktop](../desktop/README.md#feature-flag-presets) and [Mobile](../mobile/README.md#feature-flag-presets) presets.
3. `E2E_FEATURE_FLAGS_JSON`.
4. Per-test flags: `featureFlags` in `test.use()` on desktop, the `featureFlags` the test function initializes the app with on mobile.

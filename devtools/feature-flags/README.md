# @devtools/feature-flags

The Feature Flags DevTool. Lets developers inspect and override the runtime feature flags of the host app.

## Public API

```ts
import FeatureFlags, {
  ALL_FLAG_IDS,
  useFeatureFlagsState,
  useFeatureFlagsFilters,
  type FeatureFlagsToolProps,
  type FeatureFlagsToolState,
  type FeatureFlagsFiltersState,
  type FeatureFlagsFiltersInput,
  type FlagDisplayState,
  type FlagFilter,
} from "@devtools/feature-flags";
```

- `FeatureFlags` (default export) — the React component rendered by the shell.
- `FeatureFlagsToolProps` — the props contract the host must satisfy.
- `useFeatureFlagsState`, `useFeatureFlagsFilters` — local view-model hooks consumed by the component; exported in case a host wants to embed parts of the UI outside the shell.
- `ALL_FLAG_IDS` — derived from `@shared/feature-flags`' `FeatureIdSchema`.

## Props contract

```ts
interface FeatureFlagsToolProps {
  overrides: PartialFeatures;
  resolved: Features;
  setOverride: <T extends FeatureId>(key: T, value: Features[T] | undefined) => void;
  clearOverride: (key: FeatureId) => void;
  clearAllOverrides: () => void;
  defaults?: PartialFeatures;
  remote?: PartialFeatures;
  importOverrides?: (overrides: PartialFeatures) => void;
  exportOverrides?: () => PartialFeatures;
}
```

## Layout

```
feature-flags/
└── src/
    ├── FeatureFlags.tsx    # default-exported component
    ├── hooks/              # useFeatureFlagsState, useFeatureFlagsFilters
    ├── constants.ts        # ALL_FLAG_IDS (from @shared/feature-flags)
    ├── types.ts            # FeatureFlagsToolProps, FlagFilter, FlagDisplayState
    └── index.ts            # public exports + `export default FeatureFlags;`
```

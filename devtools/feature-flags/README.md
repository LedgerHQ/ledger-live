# @devtools/feature-flags

The Feature Flags DevTool. Lets developers inspect and override the runtime feature flags of the host app.

## Prerequisites

On native, the host must wrap the app in a single `GestureHandlerRootView`. Only one instance can exist for gestures (and the bottom sheets used here) to work, so it has to be provided once at the host root rather than by this tool.

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";

<GestureHandlerRootView style={{ flex: 1 }}>
  <App />
</GestureHandlerRootView>;
```

## Native dependencies

Import/export uses native modules (`expo-document-picker`, `expo-file-system`). 

To autolink them transitively, a host must point Expo autolinking at this package's `node_modules` (pnpm nests transitive deps, so the default search misses them). In the host's `package.json` (path adjusted for depth):

```json
"expo": { "autolinking": { "searchPaths": ["./node_modules", "../devtools/feature-flags/node_modules"] } }
```

Then every current and future Expo native dep of the tool links without the host re-declaring each one. After adding it, regenerate native (`pod install` / Android autolinking) and rebuild — JS-only recompiles don't link native modules. The lazy `await import(...)` in `readFile.native`/`saveFile.native` keeps importing the package safe on hosts that haven't done this yet.

You can also import the parequired packages directly.

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
  setAllOverrides: (overrides: PartialFeatures) => void;
  clearOverride: (key: FeatureId) => void;
  clearAllOverrides: () => void;
}
```

## Layout

Platform-specific files use `.web` / `.native` suffixes; the bundler picks the right one.

```
feature-flags/
└── src/
    ├── feature-flags/      # FeatureFlags.web.tsx / FeatureFlags.native.tsx (default-exported component)
    ├── components/         # UI components, each with .web/.native variants
    │   ├── toolBar/        # SearchFlag, FilterFlagControl, FlagCountIndicator, SortButton
    │   ├── flagList/       # list + per-platform view models
    │   ├── flagRow/        # a single flag row
    │   ├── flagMenu/       # import / export / reset menu (native)
    │   ├── FlagEditorBottomSheet/ # native flag editor sheet
    │   ├── flagJsonEditor/ # JSON editor + diff view (flagDiffView)
    │   ├── flagEnableIndicator/, flagCountIndicator/, flagListSummary/
    │   ├── pill/, searchFlag/, filterFlagControl/, sidebar/, SortButton/
    ├── context/            # FeatureFlagsToolContext, FlagSelectionContext (native)
    ├── hooks/              # useFeatureFlagsState, useFeatureFlagsFilters, useFlagSelection,
    │                       #   useSortFlag, useJsonEditor
    ├── utils/              # exportOverrides, importOverrides, diff, readFile/saveFile (.web/.native)
    ├── constants.ts        # ALL_FLAG_IDS (from @shared/feature-flags)
    ├── types.ts            # FeatureFlagsToolProps, FlagFilter, FlagDisplayState
    ├── index.ts            # public exports + `export default FeatureFlags;`
    └── index.native.ts     # native entry point
```

## Tests

Two jest projects, mirroring `@devtools/shell`:

- `pnpm test:web` (`jest.config.js`) — jsdom + `@testing-library/react`. Runs `*.web.test.tsx` and platform-agnostic specs; ignores `*.native.test.*`.
- `pnpm test:native` (`jest.native.config.js`) — `react-native` preset + `@testing-library/react-native`. Runs `*.native.test.{ts,tsx}` only. Render with the `jest/render.native` helper (wraps in the lumen `ThemeProvider`); native modules are mocked in `jest/setup.native.ts`.

`pnpm test` runs both.

## Typecheck

`pnpm typecheck` runs two `tsc` passes:

- `tsconfig.json` — `moduleSuffixes: [".web", ""]`; covers `.web.*` and platform-agnostic files, excludes `src/**/*.native.*`.
- `tsconfig.native.json` — `moduleSuffixes: [".native", ""]`; covers `src/**/*.native.*`.

Editors only load `tsconfig.json`, so use explicit `.native` / `.web` suffixes in cross-variant imports (e.g. `../pill/Pill.native`).

# @shared/feature-flags

Shared feature flags package for Ledger Live. Provides a **Zod-first flag registry**, an RTK slice with resolution logic, and typed selectors — replacing the scattered definitions across `@ledgerhq/types-live`, `@ledgerhq/live-common`, and each app's settings reducer.

## Quick start

### 1. Register the reducer

```ts
import featureFlags from "@shared/feature-flags";

const rootReducer = combineReducers({
  // ...existing reducers
  featureFlags,
});
```

### 2. Wire the middleware at store creation

```ts
import { createFeatureFlagsMiddleware } from "@shared/feature-flags";

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefault =>
    getDefault().concat(
      createFeatureFlagsMiddleware({
        resolutionConfig: {
          platform: "desktop", // "desktop" | "ios" | "android"
          appVersion: "2.80.0",
          appLanguage: "en",
          envFlags: parsedEnvFlags, // from FEATURE_FLAGS env variable
        },
        // Optional — when provided, the middleware fires this on creation and
        // every `refreshInterval` ms (default: 5 min), then dispatches
        // `syncRemoteConfig` so reducers can re-resolve.
        fetchRemoteFlags: async () => {
          await fetchAndActivate(remoteConfig);
          return Object.fromEntries(
            Object.entries(getAll(remoteConfig)).map(([k, v]) => [k, JSON.parse(v.asString())]),
          );
        },
      }),
    ),
});
```

### 3. Read flags in components

```ts
import { selectFeature } from "@shared/feature-flags";

const flag = useSelector(state => selectFeature(state, "lldWalletSync"));
// flag is fully typed, including params
```

## Adding a new flag

1. Create a file in the appropriate team folder under `src/flags/team-*/`:

```ts
// src/flags/team-platform/myNewFlag.ts
import { flag } from "../../define";
export const myNewFlag = flag({ enabled: false });

// For flags with typed params:
import { flagWith } from "../../define";
export const myNewFlag = flagWith({
  environment: z.enum(["STAGING", "PROD"]),
  limit: z.number(),
});
```

2. Add the barrel export in the team's `index.ts`:

```ts
export * from "./myNewFlag";
```

That's it — `FeatureId`, `Features`, `FEATURE_FLAGS_DEFAULTS`, and `FeatureIdSchema` are all derived automatically from the registry.

## Type inference

You can derive per-flag types from the registry without manual duplication:

```ts
import type { Features } from "@shared/feature-flags";

// From the resolved type
type LldModularDrawerFlag = Features["lldModularDrawer"];
type LldModularDrawerParams = Features["lldModularDrawer"]["params"];

// Or infer directly from the Zod schema
import { z } from "zod";
import { FEATURE_FLAGS_SCHEMAS } from "@shared/feature-flags";

type LldModularDrawerFlag = z.infer<typeof FEATURE_FLAGS_SCHEMAS["lldModularDrawer"]>;
```

## Resolution priority

When a flag is resolved, the following priority chain applies (highest first):

1. **Local overrides** — user-set via dev tools (`setOverride`)
2. **Env overrides** — from `FEATURE_FLAGS` environment variable
3. **Remote config** — from a third-party service (fetched by the middleware via `fetchRemoteFlags`)
4. **Default** — from the flag's Zod schema default

After resolution, **version filtering** (`desktop_version` / `mobile_version`) and **language filtering** (`languages_whitelisted` / `languages_blacklisted`) are applied.

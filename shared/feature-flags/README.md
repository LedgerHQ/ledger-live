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

### 2. Configure resolution at app startup

```ts
import { setResolutionConfig } from "@shared/feature-flags";

setResolutionConfig({
  platform: "desktop", // "desktop" | "ios" | "android"
  appVersion: "2.80.0",
  appLanguage: "en",
  envFlags: parsedEnvFlags, // from FEATURE_FLAGS env variable
});
```

### 3. Sync remote config (Firebase / LiveConfig)

```ts
import { syncRemoteConfig } from "@shared/feature-flags";

dispatch(syncRemoteConfig(remoteFlags));
```

### 4. Read flags in components

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

## Resolution priority

When a flag is resolved, the following priority chain applies (highest first):

1. **Local overrides** — user-set via dev tools (`setOverride`)
2. **Env overrides** — from `FEATURE_FLAGS` environment variable
3. **Remote config** — from Firebase / LiveConfig (`syncRemoteConfig`)
4. **Default** — from the flag's Zod schema default

After resolution, **version filtering** (`desktop_version` / `mobile_version`) and **language filtering** (`languages_whitelisted` / `languages_blacklisted`) are applied.

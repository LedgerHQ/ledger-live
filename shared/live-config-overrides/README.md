# @shared/live-config-overrides

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Local overrides of LiveConfig values, such as the `config_currency_*` coin configs, that developers set from the DevTools `coin-config` tool or the desktop Settings > Developer screen.

The package never imports `@ledgerhq/live-config`, whose published sources fail the strict presets. The host injects the LiveConfig calls.

## Exports

- `liveConfigOverridesReducer`, to register under `state.liveConfigOverrides`.
- `setLiveConfigOverride({ key, value })`: `value: undefined` removes the override. `setAllLiveConfigOverrides(map)` replaces the map: pass `{}` to restore all.
- `liveConfigOverridesSelector` and `hasLiveConfigOverridesSelector`.
- `sanitizePersistedOverrides(raw)`: validates a persisted payload before hydration. It returns `null` for anything but a plain object, and drops prototype-pollution keys and `undefined` values.
- `createLiveConfigOverridesMiddleware({ applyOverrides })`: hands the map to the host's config each time it changes.

## Usage

```ts
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import {
  createLiveConfigOverridesMiddleware,
  liveConfigOverridesReducer,
} from "@shared/live-config-overrides";

const store = configureStore({
  reducer: { liveConfigOverrides: liveConfigOverridesReducer /* , … */ },
  middleware: getDefault =>
    getDefault().concat(
      createLiveConfigOverridesMiddleware({
        applyOverrides: overrides => LiveConfig.setAllOverrides(overrides),
      }),
    ),
});
```

Persistence stays in each app: Desktop under `app.coinConfigOverrides`, Mobile under the `coinConfigOverrides` storage key. Each app hydrates through `sanitizePersistedOverrides` and `setAllLiveConfigOverrides`.

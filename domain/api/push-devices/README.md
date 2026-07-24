# @domain/api-push-devices

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Domain API client for the **Push Devices Service** — the Ledger backend endpoint that associates a user's device push tokens with their userId. RTK Query endpoint and Redux middleware, typed on `@domain/entity-client-identity`.

## Responsibility

- Define the **RTK Query endpoint** (`pushDevicesApi`) that POSTs device IDs to the Push Devices Service
- Provide **`createIdentitiesSyncMiddleware`** — a Redux middleware that watches state after every action and triggers a sync when conditions are met (consent, non-dummy userId, unsynced device IDs, no active sync, past rate-limit back-off)
- Validate config at store setup via **Zod** (`pushDevicesApiExtra`) so misconfiguration fails at boot, not at runtime
- Own **no env/config dependency** — `pushDevicesServiceUrl` and `ledgerClientVersion` are passed in at store creation time via `pushDevicesApiExtra()`

## Dependencies

| Package | Why |
|---|---|
| `@domain/entity-client-identity` | Identity types, slice actions, rate-limit state |
| `@reduxjs/toolkit` | `createApi`, `retry`, Middleware type |
| `zod` | Config validation at store setup |

## Store wiring

```ts
import { pushDevicesApi, createIdentitiesSyncMiddleware, pushDevicesApiExtra } from "@domain/api-push-devices";

configureStore({
  reducer: { [pushDevicesApi.reducerPath]: pushDevicesApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: {
          ...pushDevicesApiExtra({
            pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL"),
            ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
          }),
        },
      },
    })
    .concat(pushDevicesApi.middleware)
    .concat(createIdentitiesSyncMiddleware({
      pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL"),
      getIdentitiesState: state => state.identities,
      getAnalyticsConsent: state => selectAnalyticsConsent(state),
    })),
});
```

`pushDevicesApiExtra` throws a `ZodError` at call time if `ledgerClientVersion` is empty — catches misconfiguration at boot. An empty `pushDevicesServiceUrl` is accepted and disables sync.

## Middleware sync conditions

`createIdentitiesSyncMiddleware` triggers a sync after every Redux action when **all** of the following are true:

1. `pushDevicesServiceUrl` is non-empty
2. No sync is currently in flight (`isSyncing = false`)
3. At least 5 minutes have elapsed since the last sync failure (rate-limit)
4. `getAnalyticsConsent(state)` returns `true`
5. `identitiesState.userId` is not the dummy placeholder (or `getUserId` is provided)
6. `identitiesState.deviceIds` is non-empty
7. Either the stored `pushDevicesServiceUrl` differs from config (URL changed) or `pushDevicesSyncState === "unsynced"`

On success → dispatches `markSyncCompleted(url)`. On error or exception → records `setLastFailureTime(Date.now())` and starts the 5-minute back-off.

## File structure

```
src/
  api.ts              pushDevicesApi (createApi) + pushDevicesApiExtra() + createPushDevicesRequest()
  schema.ts           PushDevicesApiExtraSchema (Zod) — config validation
  middleware.ts       createIdentitiesSyncMiddleware (public)
  internals/
    middleware.ts     shouldSync, attemptSync, canAttemptSync, SyncMiddlewareConfig — package-private
  index.ts            Public barrel export
```

`internals/` is **not re-exported** from `index.ts`. Consumers should only use `createIdentitiesSyncMiddleware` and `pushDevicesApiExtra`.

## Testing

```sh
pnpm test      # jest
pnpm typecheck # tsc --noEmit
```

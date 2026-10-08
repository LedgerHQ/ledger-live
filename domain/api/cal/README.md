# @domain/api-cal

> [!NOTE]
> **Status: EXPERIMENTAL** — New package; the API may change while consumers are wired in.

Domain API for the **CAL service health probe**. It injects one endpoint, `getCalProbe`, into the
shared `calApi` from `@shared/api-services` (no new `createApi` or reducer).

## Result

`useGetCalProbeQuery()` resolves to a `CalProbeResult`:

| Result    | Meaning                                                                    | Policy      |
| --------- | -------------------------------------------------------------------------- | ----------- |
| `ok`      | CAL answered with a 2xx                                                    |             |
| `failed`  | CAL answered with a non-2xx, did not answer within 5s, or the URL is invalid | fail closed |
| `offline` | Network error, or the OS reports no connectivity                           | fail open   |

## Behaviour

- Probes `GET {calServiceUrl}/v1/currencies?output=id&limit=1`, the call that holds the app at launch.
- Explicit timeout (`PROBE_TIMEOUT_MS`, 5s) and **no retry**: it uses `queryFn`, bypassing the
  retry-wrapped base query of `calApi`.
- Never throws; every outcome maps to a `CalProbeResult`.
- `keepUnusedDataFor: 0`: the result is not cached once unsubscribed. Call `refetch()` to probe again.

## Store wiring (app side)

The service URL and client version come from the store's thunk `extraArgument`:

```ts
configureStore({
  reducer: { [calApi.reducerPath]: calApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: calApiExtra({
          calServiceUrl: getEnv("CAL_SERVICE_URL"),
          ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
        }),
      },
    }).concat(calApi.middleware),
});
```

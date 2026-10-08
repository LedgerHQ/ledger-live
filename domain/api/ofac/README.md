# @domain/api-ofac

> [!CAUTION]
> **Status: UNSTABLE** — New package; API may change as the OFAC flow migrates onto it.

Domain API client for the **OFAC geo-block check**, backed by the Ledger Countervalues Service
(CVS). Injects a `check` RTK Query endpoint into the shared `countervaluesApi` and exports
`useCheckQuery`.

`data` is `true` only for HTTP 451 (geo-blocked) and `false` only for HTTP 200. Any other status,
or a network failure, is a query error (`isError`), not an allowed result.

Owns no env/config dependency: the CVS URL comes from the store's thunk `extraArgument` via
`cvsApiExtra({ getCountervaluesServiceUrl })`, the same contract apps already pass for other CVS
use cases.

- `api.ts` — `ofacApi` injects `check` (`GET /v3/markets`) into `countervaluesApi`. Accepts HTTP
  200 and 451 as success, maps status 451 to `true`, and opts out of the shared base-query retry.

Store wiring (app side) registers the **service** api; importing this package injects the endpoint:

```ts
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { useCheckQuery } from "@domain/api-ofac";

configureStore({
  reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: cvsApiExtra({
          getCountervaluesServiceUrl: () => getEnv("LEDGER_COUNTERVALUES_API"),
        }),
      },
    }).concat(countervaluesApi.middleware),
});
```

Wiring into apps and removing `libs/ledger-live-common/src/api/ofacGeoBlockApi.ts` is out of scope
for this package.

# @shared/api-services

> [!CAUTION]
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

One **endpoint-less** RTK Query api per backend service. Each service owns everything about *reaching*
one backend — base URL, base query, retry policy, reducer path and the thunk `extraArgument` contract —
and nothing about *what* is fetched from it.

Use-case packages in `domain/api/*` add their endpoints with
[`injectEndpoints`](https://redux-toolkit.js.org/rtk-query/usage/code-splitting#injecting-endpoints)
and their cache tags with `enhanceEndpoints({ addTagTypes })`. Both mutate and return the *same* api
object, so one reducer, one middleware and one cache serve every use case on a given backend.

| Service | Reducer path | Injectors |
| --- | --- | --- |
| `services/cal` | `calApi` | `@domain/api-currency-token` |
| `services/coinmarketcap` | `coinMarketCapApi` | `@domain/api-altcoins-sentiment`, `@domain/api-market-sentiment` |
| `services/countervalues` | `countervaluesApi` | `@domain/api-currency-fiat` |
| `services/push-devices` | `pushDevicesApi` | `@domain/api-push-devices` |

## What lives here, and what does not

This is the seam: **reaching a backend** here, **what you ask it for** in `domain/api/*`.

| Concern | Owner | Why |
| --- | --- | --- |
| Base URL, headers, retry, auth | **here** | How to reach the service, identical for every use case |
| `extraArgument` schema + builder + reader | **here** | It configures the base query, which lives here |
| `reducerPath` | **here** | One store slice per backend, not per use case |
| Endpoints, `query`, `transformResponse` | `domain/api/*` | What a use case asks for |
| Wire schemas, entity conversion | `domain/api/*` | Response shape is a use-case concern |
| **Cache tags** | `domain/api/*` | A tag names *data a use case owns*. It is registered on the shared api via `enhanceEndpoints({ addTagTypes })`, so this package never has to know it exists |
| Hooks, persistence | `domain/api/*` | Built on the endpoints |

That tag split is the important one. `tagTypes` is not accepted by `injectEndpoints`, so it would be
easy to assume the shared api must declare every tag upfront — it does not. `enhanceEndpoints` widens
the tag union in place, which keeps tags next to the endpoints that provide them and means **adding a
use case never requires editing another backend's file**.

This package sits in `shared/` rather than `domain/` because after that split it holds no domain
knowledge at all: no entity schemas, no cache tags, no business vocabulary — only HTTP plumbing and the
config contract for it. It has no workspace dependencies, just `@reduxjs/toolkit` and `zod`.

## Layout

One directory per service, each self-contained:

```
src/services/<service>/
  api.ts          # extra builder + reader, base query, empty createApi
  api.test.ts     # reducer path, zero endpoints, extraArgument validation
  constants.ts    # reducer path, retry count, protocol headers
  schema.ts       # extraArgument contract
  types.ts        # inferred extraArgument type
  index.ts        # public surface — keeps constants internal unless a consumer needs them
```

A service's `index.ts` deliberately does **not** `export *` from `constants.ts`: several services
declare a `MAX_RETRIES` and a client-version header, and star-exporting them all would make those names
ambiguous at the package barrel — silently dropping them. Each service exports only the constants its
consumers actually need.

## Usage

**Register the service api; call endpoints on the use-case package.**

```ts
import { calApi, calApiExtra } from "@shared/api-services";

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

Injection is a module-level side effect: an endpoint only exists once its use-case module has been
evaluated as a *value* import. A type-only import will not trigger it, and the api exported from here
is never typed with anyone's endpoints — only the injected reference is.

> [!NOTE]
> Because the api registered here declares no tags, its reducer state type is *narrower* than that of an
> injected reference whose use case added some. A helper typed on the injected api will therefore not
> accept an app's `State` — type it on the service api instead. See `WithCryptoAssetsApi` in
> `@domain/api-currency-token`.

## Adding a service

1. Add `src/services/<service>/` with the files above and
   `createApi({ ..., tagTypes: [], endpoints: () => ({}) })`.
2. Re-export it from `src/services/index.ts`.
3. Register it in both apps' `rtkQueryApi.ts`.

Each service's `extraArgument` builder stays separate — there is deliberately no aggregate builder,
because consumers like `apps/web-tools`, `apps/cli` and `buildStandaloneCryptoAssetsStore` configure
one service only and must not be forced to supply config for services they never call.

A backend belongs here only if its base query is **pure transport**. `@domain/api-pay-card` keeps its
own `createApi`: its base query resolves mocks keyed by endpoint URL and typed from its own response
schemas, so splitting it would either drag that wire contract in here or leave this side owning nothing.

> [!NOTE]
> `@domain/api-aggregated-assets` is a placeholder for **DADA**, which currently lives as
> `assetsDataApi` in `libs/ledger-live-common`. When it migrates, its base belongs here as
> `src/services/dada/` rather than as another standalone `createApi`.

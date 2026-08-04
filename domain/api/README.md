# domain/api/

> Part of the [DDD monorepo architecture](../../docs/ddd-monorepo-architecture.md).

Domain API packages. Each subdirectory is an independent pnpm workspace package covering network
access for a domain: RTK Query endpoints, `createAsyncThunk` actions, or a re-export/composition of
existing ones under a unified access point.

## Two halves: reaching a backend vs. what you ask it for

`createApi` normally bundles both — base URL, headers and retry sit right next to the endpoints. That
forces the *reaching* half to be re-declared per use case, so two packages hitting the same backend
duplicate it and end up with two store slices, two caches and two middlewares for one service.

**Every package here splits them, from the start** — this is the default, not something to reach for
once a second use case appears. Doing it upfront costs nothing and makes the second use case a one-line
addition instead of a migration.

| Half | Owner | Contains |
| --- | --- | --- |
| **Reaching a backend** | [`@shared/api-services`](../../shared/api-services/README.md) | One endpoint-less `createApi` per backend: base URL, base query, retry, reducer path, `extraArgument` contract |
| **What you ask it for** | `@domain/api-<name>` (here) | Endpoints, wire schemas, transforms, **cache tags**, hooks, persistence |

A use-case package takes the shared api and adds to it:

```ts
import { coinMarketCapApi, FIFTEEN_MINUTES_IN_SECONDS } from "@shared/api-services";

/** Cache tags belong to the use case that owns the data — not to the shared service. */
export const FEAR_AND_GREED_TAGS = ["FearAndGreedLatest"] as const;

export const marketSentimentApi = coinMarketCapApi
  .enhanceEndpoints({ addTagTypes: FEAR_AND_GREED_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getFearAndGreedLatest: build.query<FearAndGreedIndex, void>({
        query: () => ({ url: "/fear-and-greed/latest" }),
        providesTags: [...FEAR_AND_GREED_TAGS],
        keepUnusedDataFor: FIFTEEN_MINUTES_IN_SECONDS,
      }),
    }),
  });

export const { useGetFearAndGreedLatestQuery } = marketSentimentApi;
```

Both `enhanceEndpoints` and `injectEndpoints` **mutate and return the same api object**, so every use
case on a backend shares one reducer, one middleware and one cache — while each package's own export is
the only one typed with its endpoints.

### Cache tags stay here

`tagTypes` is not accepted by `injectEndpoints`, which makes it tempting to assume the shared service
must declare every tag upfront. It must not. `enhanceEndpoints({ addTagTypes })` widens the tag union in
place, so a tag lives next to the endpoints that provide it and **adding a use case never means editing
a shared file**.

## Register the service, import hooks from the use case

The service api owns `reducerPath` / `reducer` / `middleware`, so **it is what the app store
registers** — the registry then reads as a list of the backends the app talks to, not of its use cases.
But injection is a module-level side effect: an endpoint only exists once its use-case module has been
evaluated as a *value* import. So:

- **Apps** register the service apis from `@shared/api-services`.
- **Features** import hooks (and any `.endpoints.*` access) from the **use-case** package. That import
  is what triggers injection, and only that reference carries the endpoint types.
- **Never** import an api from `@shared/api-services` in order to call endpoints on it. A type-only
  import will not trigger injection either.

> [!NOTE]
> The registered api declares no tags, so its reducer state type is *narrower* than an injected
> reference whose use case added some. A helper typed on the injected api will not accept an app's
> `State` — type it on the service api. `WithCryptoAssetsApi` in `currency-token/src/persistence.ts` is
> the worked example.

## Not yet migrated

`@domain/api-pay-card` still declares its own `createApi`. This is a **holdout, not a sanctioned
pattern** — do not copy it. Its base query resolves mock responses keyed by endpoint URL and typed from
its own wire schemas, so it has to be made transport-only before it can move. Owned by the Pay Card
team to migrate; see [LIVE-33829](https://ledgerhq.atlassian.net/browse/LIVE-33829).

Every other backend goes through `@shared/api-services`, and any new one must.

## Scope

`@domain/api-<name>` (e.g. `@domain/api-currency-token`)

## Responsibility

- **Define** RTK Query endpoints or `createAsyncThunk` actions for a domain, or **compose and
  re-export** existing ones
- Provide a single import path for all API endpoints related to a domain entity
- Use entity schemas from `@domain/entity-<name>` for request/response typing

## Conventions

- One package per domain entity
- Package name: `@domain/api-<name>` — directory name matches, e.g. `domain/api/<name>/`
- `package.json` must have `"private": true`
- Must depend on the corresponding `@domain/entity-<name>` package
- Barrel export via `src/index.ts`

## File Structure

```
api.ts          # injectEndpoints on a service api, or createApi (required)
api.test.ts     # Endpoint/integration tests (required; MSW recommended if that's the project standard)
index.ts        # Barrel exports (required)
```

> [!NOTE]
> `@domain/api-aggregated-assets` is a placeholder for **DADA**, which currently lives as
> `assetsDataApi` in `libs/ledger-live-common`. When it migrates, its endpoints belong here and its base
> in `@shared/api-services`.

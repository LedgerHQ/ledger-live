# @domain/api-market-index-altcoin-season

> [!CAUTION]
> **Status: UNSTABLE** — Under active development.

Domain API client for the **CoinMarketCap Altcoin Season Index**, which measures how much market
capital has rotated out of Bitcoin and into altcoins. RTK Query endpoint typed on the canonical
`@domain/entity-market-index-altcoin-season` entity. Owns no env/config/logging dependency.

The endpoint is injected into the shared `coinMarketCapApi` from
[`@shared/api-services`](../../../shared/api-services/README.md), so it shares that service's
reducer, middleware and cache with every other CoinMarketCap use case. This package therefore
declares no `createApi`, no `reducerPath` and no `extraArgument` contract of its own.

- `schema.ts` — `AltcoinSeasonIndexResponseSchema`, the Zod schema for the raw CoinMarketCap
  `/altcoin-season-index/latest` wire response (`data` plus `status`).
- `types.ts` — the inferred `AltcoinSeasonIndexResponse` type.
- `transforms.ts` — `transformAltcoinSeasonIndexResponse(raw) → AltcoinSeasonIndex`: validates the
  wire response and maps it to the canonical entity. Throws a `ZodError` on an invalid payload.
- `api.ts` — `altcoinSeasonApi`: the shared `coinMarketCapApi` with `ALTCOIN_SEASON_INDEX_TAGS`
  registered through `enhanceEndpoints` and the `getAltcoinSeasonIndexLatest` query added through
  `injectEndpoints`. Also exports `useGetAltcoinSeasonIndexLatestQuery` and the `AltcoinSeasonApi`
  type. Responses are kept for 15 minutes, the cadence at which CoinMarketCap refreshes the index.

Both `enhanceEndpoints` and `injectEndpoints` mutate and return the same api object, so
`altcoinSeasonApi` and `coinMarketCapApi` are one object at runtime. Only `altcoinSeasonApi` carries
the type of the endpoint below.

## Consuming it

Injection is a module-level side effect, so the endpoint exists only once this package has been
imported as a value. Import the hook from here, never from `@shared/api-services`:

```ts
import { useGetAltcoinSeasonIndexLatestQuery } from "@domain/api-market-index-altcoin-season";

const { data, isLoading } = useGetAltcoinSeasonIndexLatestQuery();
```

## Store wiring (app side)

The app registers the **service** api, not this package:

```ts
import { coinMarketCapApi, coinMarketCapApiExtra } from "@shared/api-services";

configureStore({
  reducer: { [coinMarketCapApi.reducerPath]: coinMarketCapApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: coinMarketCapApiExtra({ coinMarketCapApiUrl: getEnv("CMC_API_URL") }),
      },
    }).concat(coinMarketCapApi.middleware),
});
```

`coinMarketCapApiExtra` throws a `ZodError` at call time if the URL is empty, so a misconfigured
environment fails at boot rather than on the first request.

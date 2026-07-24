# @domain/api-altcoins-sentiment

> [!CAUTION]
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Domain API client for **altcoins sentiment**, backed by the CoinMarketCap Altcoin Season Index
endpoint. RTK Query endpoint typed on the canonical `@domain/entity-altcoins-sentiment` entity. Owns
no env/config/logging dependency.

- `schema.ts` — Zod schema for the raw CMC `/altcoin-season-index/latest` response
  (`AltcoinSeasonIndexResponseSchema`) and the `extraArgument` contract
  (`AltcoinsSentimentApiExtraSchema`).
- `types.ts` — inferred `AltcoinSeasonIndexResponse` and `AltcoinsSentimentApiExtra` types.
- `transforms.ts` — `transformAltcoinSeasonIndexResponse(raw) → AltcoinSeasonIndex`: validates the
  wire response and maps it to the canonical entity (throws on invalid payloads).
- `api.ts` — `altcoinsSentimentApi` (`createApi`) with the `getAltcoinSeasonIndexLatest` query. The
  CMC URL is read from the store's thunk `extraArgument`; the app supplies it via
  `altcoinsSentimentApiExtra(...)`. Also exports `FIFTEEN_MINUTES_IN_MS` (polling interval) and
  `useGetAltcoinSeasonIndexLatestQuery`.
- `internals/` — **package-private** (except `FIFTEEN_MINUTES_IN_MS`, re-exported via `api.ts`): cache
  tags, reducer path, cache lifetime and polling interval.

Store wiring (app side):

```ts
configureStore({
  reducer: { [altcoinsSentimentApi.reducerPath]: altcoinsSentimentApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: altcoinsSentimentApiExtra({ coinMarketCapApiUrl: getEnv("CMC_API_URL") }),
      },
    }).concat(altcoinsSentimentApi.middleware),
});
```

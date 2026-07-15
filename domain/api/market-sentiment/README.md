# @domain/api-market-sentiment

Domain API client for **market sentiment**, backed by the CoinMarketCap Crypto Fear & Greed endpoint.
RTK Query endpoint typed on the canonical `@domain/entity-market-sentiment` entity. Owns no
env/config/logging dependency.

- `schema.ts` — Zod schema for the raw CMC `/fear-and-greed/latest` response
  (`FearAndGreedResponseSchema`) and the `extraArgument` contract (`MarketSentimentApiExtraSchema`).
- `types.ts` — inferred `FearAndGreedResponse` and `MarketSentimentApiExtra` types.
- `transforms.ts` — `transformFearAndGreedResponse(raw) → FearAndGreedIndex`: validates the wire
  response and maps it to the canonical entity (throws on invalid payloads).
- `api.ts` — `marketSentimentApi` (`createApi`) with the `getFearAndGreedLatest` query. The CMC URL is
  read from the store's thunk `extraArgument`; the app supplies it via `marketSentimentApiExtra(...)`.
  Also exports `FIFTEEN_MINUTES_IN_MS` (polling interval) and `useGetFearAndGreedLatestQuery`.
- `internals/` — **package-private** (except `FIFTEEN_MINUTES_IN_MS`, re-exported via `api.ts`): cache
  tags, reducer path, cache lifetime and polling interval.
- `fearAndGreed.mock.ts` — response mock for app MSW handlers, exposed via the `./mock` subpath.

Store wiring (app side):

```ts
configureStore({
  reducer: { [marketSentimentApi.reducerPath]: marketSentimentApi.reducer },
  middleware: gdm =>
    gdm({
      thunk: {
        extraArgument: marketSentimentApiExtra({ coinMarketCapApiUrl: getEnv("CMC_API_URL") }),
      },
    }).concat(marketSentimentApi.middleware),
});
```

Fear & Greed UI helpers (level, color and translation-key mapping) live in
`@features/flow-fear-and-greed`.

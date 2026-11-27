# @domain/api-market-index-global

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Domain API client for the **global crypto market snapshot** (total market cap and 24h change),
typed on `@domain/entity-market-index-global`.

The name follows the `market-index-*` family of domain indices, but the backend is the
**Countervalues service** (`/v3/markets/global`), not CoinMarketCap.

The endpoint is injected into the shared `countervaluesApi` from `@shared/api-services`, so it
shares that service's reducer, middleware and cache. No `createApi` of its own.

- `schema.ts` / `types.ts` — raw wire schema (`percentageChanges` are ratios) and request params.
- `transforms.ts` — `transformGlobalMarketResponse`: maps to the entity, `changePercentage24h = 1d * 100`.
- `api.ts` — `marketIndexGlobalApi` with `getGlobalMarketData` (no retries, kept 3 minutes) and
  `useGetGlobalMarketDataQuery`. A rejected schema becomes a `CUSTOM_ERROR`.

```ts
import { useGetGlobalMarketDataQuery } from "@domain/api-market-index-global";

const { data } = useGetGlobalMarketDataQuery({ counterCurrency: "usd" });
```

Store wiring: register `countervaluesApi` and pass
`cvsApiExtra({ getCountervaluesServiceUrl })` as the thunk `extraArgument`.

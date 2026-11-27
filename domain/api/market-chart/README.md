# @domain/api-market-chart

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Domain API client for **market price charts**, typed on `@domain/entity-market-chart`.

Endpoints are injected into the shared `countervaluesApi` from `@shared/api-services`, so they share
that service's reducer, middleware and cache. No `createApi` of its own.

- `api.ts` — `marketChartApi` with `getAssetChartData` (`/v3/markets/chart/<segment>/<id>`, kept 1 minute)
  and `getSupportedChartCounterCurrencies` (lowercased, kept 1 day). No retries. A rejected schema
  becomes a `CUSTOM_ERROR`.
- `types.ts` — request params.
- `toMarketChartRange.ts` — narrows a loose range string to a `MarketChartRange`, `undefined` when unknown.
- `internals/` — private range-to-URL-segment mapping and schema failure description.

```ts
import { useGetAssetChartDataQuery } from "@domain/api-market-chart";

const { data } = useGetAssetChartDataQuery({ id: "bitcoin", counterCurrency: "usd", range: "1w" });
```

Store wiring: register `countervaluesApi` and pass
`cvsApiExtra({ getCountervaluesServiceUrl })` as the thunk `extraArgument`.

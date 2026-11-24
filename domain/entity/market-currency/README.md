# @domain/entity-market-currency

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Domain entity for the **market currency list**: the app-facing model and the constants that describe
the list.

- `schema.ts` — Zod schemas: `MarketCurrencySchema` (the currency as the market list and the market
  detail read it), `MarketListQueryArgSchema`, `MarketCurrencyChartDataSchema`, and the enum schemas
  of `Order` and `KeysPriceChange`.
- `types.ts` — the `Order` and `KeysPriceChange` enums, `MARKET_LIST_PAGE_SIZES`,
  `MARKET_LIST_MIN_SEARCH_LENGTH`, and the `MarketCurrency`, `MarketListQueryArg` and
  `MarketCurrencyChartData` types inferred from `schema.ts`.
- `pairing.ts` — `pairMarketsWithRequestedLedgerIds`: pairs each requested ledger id with its market,
  in request order.

This is the transformed, app-facing model. The raw `/v3/markets` wire type and the RTK Query endpoints
live in `@domain/api-market-currency`.

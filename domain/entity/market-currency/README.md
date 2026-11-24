# @domain/entity-market-currency

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Domain entity for the **market currency list**: the app-facing model and the constants that describe
the list.

- `types.ts` — `MarketCurrency` (the currency as the market list and the market detail read it),
  `MarketListQueryArg`, the `Order` and `KeysPriceChange` enums, `MARKET_LIST_PAGE_SIZES`,
  `MARKET_LIST_MIN_SEARCH_LENGTH`, and `SparklineSvgData`.
- `pairing.ts` — `pairMarketsWithRequestedLedgerIds`: pairs each requested ledger id with its market,
  in request order.

This is the transformed, app-facing model. The raw `/v3/markets` wire type and the RTK Query endpoints
live in `@domain/api-market-currency`.

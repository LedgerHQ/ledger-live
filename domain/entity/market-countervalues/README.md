# @domain/entity-market-countervalues

> [!CAUTION]
> **Status: UNSTABLE** — Being migrated out of `@ledgerhq/live-countervalues`; API may change.

Domain entity for **countervalues**: the rate state the apps hold, and the pure logic over it.

A countervalue is what an amount of one currency is worth in another. This package owns the shape
of the rates once they have been fetched, and every computation that reads them. It knows nothing
about the network, React or accounts: fetching lives in `@domain/api-market-countervalues`, and
turning accounts into pairs to track lives in the app layer.

- `schema.ts` — the Zod schemas. `CounterValuesState` and its serialized twin
  `CounterValuesStateRaw`, `RateMap`, `TrackingPair`, `CountervaluesSettings`,
  `PairRateMapCache` and `RateMapStats`.
- `types.ts` — the types inferred from them, plus `BatchStrategySolver`.
- `helpers.ts` — `pairId`, the `YYYY-MM-DD` / `YYYY-MM-DDTHH` date keys the rate maps are keyed by,
  `magFromTo` and `inferCurrencyAPIID`.
- `logic.ts` — `calculate` and `calculateMany`, the `lenseRate*` lookups, `initialState`,
  `importCountervalues` / `exportCountervalues` and the tracking-pair resolution.

Currencies come from `@domain/entity-currency`; only `type`, `id`, `ticker` and
`units[0].magnitude` are ever read.

## `./mock`

`@domain/entity-market-countervalues/mock` holds the reference rate table the mock countervalues
API derives its answers from. It is a fixture, deliberately outside the barrel.

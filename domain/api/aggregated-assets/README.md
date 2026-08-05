# @domain/api-aggregated-assets

> [!CAUTION]
> **Status: UNSTABLE** — Being migrated out of `live-common`; the API is still being assembled.

Domain API client for **DADA** — Dynamic Assets Data Aggregator — the service that returns
aggregated crypto asset metadata, market data and interest rates.

One DADA response carries six collections in a single payload:

| Collection | Owned by |
| --- | --- |
| `cryptoAssets` | `@domain/entity-aggregated-asset` |
| `interestRates` | `@domain/entity-interest-rate` |
| `cryptoOrTokenCurrencies` | `@domain/entity-currency` (via `@domain/api-currency-token`) |
| `networks` | **this package**, as a wire type — resolves to `@domain/entity-currency-crypto`, since a network *is* a chain |
| `currenciesOrder` | **this package**, as response metadata — a sort key and ordered ids, not a business object |
| `markets` | nobody yet — see below |

This package owns the cross-entity response contract, the requests, the transformations and the
RTK Query endpoints. It does not own UI or app composition.

## Why the wire types live here

`ApiAsset`, `ApiTokenCurrency`, `ApiCryptoCurrency` and `RawApiResponse` describe DADA's
**transport format**, so they belong to the API package. The entity packages own only canonical
shapes. `AssetsData` — the transformed aggregate — is this package's return contract, composed of
those entities.

This mirrors `domain/api/market-sentiment` + `domain/entity/market-sentiment`, where the entity
owns the canonical schema and the API owns the wire schema plus `transforms.ts`.

## `markets` is deliberately loosely typed

There is no `domain/entity/market`, and the `markets` collection keeps its existing type,
`PartialMarketItemResponse` = `Partial<MarketItemResponse>`.

Creating a real market entity would roughly double the migration and pull in a large surface owned
by another team. Because every field of a `Partial<>` is optional there is also nothing meaningful
to validate, so `markets` is excluded from the response-validation work.

### Accepted debt

`dadaIdToMarketId()` and the market item type are **copied** from
`libs/ledger-live-common/src/market`, not imported: a `domain/*` package must not import legacy
`libs/*`. Since every field is optional, future divergence from the original will **never** produce
a type error. Revisit when a real market entity exists.

## Invariants owned here

Both are load-bearing and neither can produce a type error, so do not "clean them up":

1. **`convertApiAssets` is lenient by design.** It silently drops tokens whose parent chain is
   unknown, and *synthesises* a currency (placeholder `color`, empty `explorerViews`) for cryptos
   missing from the local registry rather than dropping them. Assets DADA knows about but the local
   CAL does not still render.
2. **`getChunkedAssetsData` succeeds if _any_ chunk resolves.** Requests are chunked by currency id;
   partial results are returned rather than failing the whole query.

When response validation is added, it must use per-item `safeParse`-and-drop, never a top-level
`parse()`. DADA is a live aggregator whose shape evolves, and one unmodelled field failing the whole
response would blank out Market, Portfolio and the asset selector.

## Status

Scaffolded and empty. Code arrives from `libs/ledger-live-common/src/dada-client` in `LIVE-35226`.
Tracking epic: `LIVE-35223`.

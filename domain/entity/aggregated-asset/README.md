# @domain/entity-aggregated-asset

> [!CAUTION]
> **Status: UNSTABLE** — Being migrated out of `live-common`; the API is still being assembled.

Domain entity for the **aggregated asset** — a meta-currency that groups several per-network
currencies under one logical asset.

| Type | Describes |
| --- | --- |
| `CryptoAssetMeta` | The aggregated asset: id, ticker, name, and `assetsIds` mapping each network to its currency id |

This resolves more than the lower-level currency / token / fiat types, which is what earns it its
own entity: it is grouped by network rather than being a single currency.

Deliberately **not** here:

| Type | Lives in | Why |
| --- | --- | --- |
| `NetworkInfo` | `@domain/api-aggregated-assets` as a wire type | `{ id, name }`; a network *is* a chain, already modelled by `@domain/entity-currency-crypto`. Resolve to that rather than duplicating the concept. |
| `CurrenciesOrder` | `@domain/api-aggregated-assets` response contract | `{ key, order, metaCurrencyIds }` is server sort metadata, not a business object. |

Pure entity package: runtime schemas, inferred types, defaults and mocks. **No network calls, no
feature state.** Requests, transformations and RTK Query endpoints belong to
`@domain/api-aggregated-assets`; the wire-format types belong there too, since they describe DADA's
transport shape rather than a canonical one.

## Status

Scaffolded and empty. Types arrive from `libs/ledger-live-common/src/dada-client/entities` in
`LIVE-35226`. Tracking epic: `LIVE-35223`.

# @domain/entity-interest-rate

> [!CAUTION]
> **Status: UNSTABLE** — Being migrated out of `live-common`; the API is still being assembled.

Domain entity for asset interest rates. Owns the canonical rate shape and the set of rate types the
apps understand:

| Type | Describes |
| --- | --- |
| `InterestRate` | A rate for one currency: `currencyId`, `rate`, `type` and `fetchAt` |
| `ApyType` | The recognised rate kinds — `NRR`, `APY`, `APR` |

`ApyType` is an allowlist, and it is enforced at the consumer boundary: a rate arriving with any
other `type` is dropped rather than displayed. That filtering behaviour is characterized in the
consuming hook's tests.

Pure entity package: runtime schemas, inferred types, defaults and mocks. **No network calls, no
feature state.**

## Status

Scaffolded and empty. Types arrive from `libs/ledger-live-common/src/dada-client` in `LIVE-35226`.
Tracking epic: `LIVE-35223`.

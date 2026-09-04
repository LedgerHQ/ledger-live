# @domain/api-currency-fiat

## 0.4.3-next.0

### Patch Changes

- Updated dependencies [[`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8)]:
  - @shared/api-services@0.6.0-next.0

## 0.4.2

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0

## 0.4.2-next.0

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc)]:
  - @shared/api-services@0.4.0

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc)]:
  - @shared/api-services@0.4.0-next.0

## 0.4.0

### Minor Changes

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf)]:
  - @domain/entity-currency-fiat@0.4.0
  - @shared/api-services@0.3.0

## 0.4.0-next.0

### Minor Changes

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf)]:
  - @domain/entity-currency-fiat@0.4.0-next.0
  - @shared/api-services@0.3.0-next.0

## 0.3.0

### Minor Changes

- [#20341](https://github.com/LedgerHQ/ledger-live/pull/20341) [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e) Thanks [@ysitbon](https://github.com/ysitbon)! - Split backend access from use case in the RTK Query layer

  `@shared/api-services` now holds one endpoint-less `createApi` per backend (CAL, CoinMarketCap,
  Countervalues, Push Devices), owning its base query, `extraArgument` contract and reducer path.
  `domain/api/*` packages add their endpoints with `injectEndpoints` and their own cache tags with
  `enhanceEndpoints`, so one reducer, middleware and cache now serve every use case on a backend — the two
  CoinMarketCap packages previously had one each. Apps register the service apis.

  `extraArgument` builder names are unchanged, so only import paths move. Reducer paths are renamed after
  their backend (`calApi`, `coinMarketCapApi`, `countervaluesApi`); no persisted data and no endpoint
  behaviour is affected.

### Patch Changes

- Updated dependencies [[`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e)]:
  - @shared/api-services@0.2.0

## 0.3.0-next.0

### Minor Changes

- [#20341](https://github.com/LedgerHQ/ledger-live/pull/20341) [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e) Thanks [@ysitbon](https://github.com/ysitbon)! - Split backend access from use case in the RTK Query layer

  `@shared/api-services` now holds one endpoint-less `createApi` per backend (CAL, CoinMarketCap,
  Countervalues, Push Devices), owning its base query, `extraArgument` contract and reducer path.
  `domain/api/*` packages add their endpoints with `injectEndpoints` and their own cache tags with
  `enhanceEndpoints`, so one reducer, middleware and cache now serve every use case on a backend — the two
  CoinMarketCap packages previously had one each. Apps register the service apis.

  `extraArgument` builder names are unchanged, so only import paths move. Reducer paths are renamed after
  their backend (`calApi`, `coinMarketCapApi`, `countervaluesApi`); no persisted data and no endpoint
  behaviour is affected.

### Patch Changes

- Updated dependencies [[`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e)]:
  - @shared/api-services@0.2.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7)]:
  - @domain/entity-currency-fiat@0.3.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7)]:
  - @domain/entity-currency-fiat@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#19075](https://github.com/LedgerHQ/ledger-live/pull/19075) [`b837f65`](https://github.com/LedgerHQ/ledger-live/commit/b837f65b79b2d27b0b29d4037b18837c5a1b7ca5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `@domain/api-currency-fiat`, the RTK Query client for fiat currencies backed by the Ledger
  Countervalues Service (CVS): `currencyFiatApi` (`getSupportedFiats`), the Zod response schema and the
  tickers→`FiatCurrency[]` resolver (`resolveSupportedFiats`: OFAC filtering, registry-based resolution
  and de-duplication). The CVS URL is injected via the store's thunk `extraArgument` (`cvsApiExtra`),
  so the package owns no env/config dependency. Typed on `@domain/entity-currency-fiat`; no
  `@ledgerhq/*` dependency. Not yet wired into the apps.

  `@domain/entity-currency-fiat` gains a by-ticker lookup (`FIAT_CURRENCIES_BY_TICKER` +
  `getFiatCurrencyByTicker`), since the CVS returns ISO 4217 tickers while the registry is keyed by id.

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a) Thanks [@ysitbon](https://github.com/ysitbon)! - Add supported-fiats RTK slice to @domain/entity-currency-fiat; wire currencyFiatApi onQueryStarted to dispatch it; register currencyFiatApi in desktop and mobile stores with cvsApiExtra extraArgument composition.

### Patch Changes

- Updated dependencies [[`b837f65`](https://github.com/LedgerHQ/ledger-live/commit/b837f65b79b2d27b0b29d4037b18837c5a1b7ca5), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9)]:
  - @domain/entity-currency-fiat@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#19075](https://github.com/LedgerHQ/ledger-live/pull/19075) [`b837f65`](https://github.com/LedgerHQ/ledger-live/commit/b837f65b79b2d27b0b29d4037b18837c5a1b7ca5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `@domain/api-currency-fiat`, the RTK Query client for fiat currencies backed by the Ledger
  Countervalues Service (CVS): `currencyFiatApi` (`getSupportedFiats`), the Zod response schema and the
  tickers→`FiatCurrency[]` resolver (`resolveSupportedFiats`: OFAC filtering, registry-based resolution
  and de-duplication). The CVS URL is injected via the store's thunk `extraArgument` (`cvsApiExtra`),
  so the package owns no env/config dependency. Typed on `@domain/entity-currency-fiat`; no
  `@ledgerhq/*` dependency. Not yet wired into the apps.

  `@domain/entity-currency-fiat` gains a by-ticker lookup (`FIAT_CURRENCIES_BY_TICKER` +
  `getFiatCurrencyByTicker`), since the CVS returns ISO 4217 tickers while the registry is keyed by id.

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a) Thanks [@ysitbon](https://github.com/ysitbon)! - Add supported-fiats RTK slice to @domain/entity-currency-fiat; wire currencyFiatApi onQueryStarted to dispatch it; register currencyFiatApi in desktop and mobile stores with cvsApiExtra extraArgument composition.

### Patch Changes

- Updated dependencies [[`b837f65`](https://github.com/LedgerHQ/ledger-live/commit/b837f65b79b2d27b0b29d4037b18837c5a1b7ca5), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9)]:
  - @domain/entity-currency-fiat@0.2.0-next.0

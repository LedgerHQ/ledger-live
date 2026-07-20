# @domain/api-currency-fiat

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

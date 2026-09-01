# @shared/schema-primitives

## 0.5.0-next.0

### Minor Changes

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

## 0.4.0

### Minor Changes

- [#20582](https://github.com/LedgerHQ/ledger-live/pull/20582) [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the currency id schemas to the packages that own them.

  `CryptoCurrencyIdSchema`, `TokenCurrencyIdSchema` and `FiatCurrencyIdSchema` (and their inferred
  types) now live in `@domain/entity-currency-crypto`, `@domain/entity-currency-token` and
  `@domain/entity-currency-fiat` respectively, instead of `@shared/schema-primitives`. A primitives
  package has no business knowing about crypto, tokens or fiat.

  The crypto and token packages used to re-export these symbols from primitives, which made them
  proxies: two import paths for the same thing, and no obvious original provider. Consumers already
  importing from `@domain/entity-currency-*` are unaffected, since the symbols genuinely moved there.
  Anything importing them from `@shared/schema-primitives` must now import the owning domain package.

## 0.4.0-next.0

### Minor Changes

- [#20582](https://github.com/LedgerHQ/ledger-live/pull/20582) [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the currency id schemas to the packages that own them.

  `CryptoCurrencyIdSchema`, `TokenCurrencyIdSchema` and `FiatCurrencyIdSchema` (and their inferred
  types) now live in `@domain/entity-currency-crypto`, `@domain/entity-currency-token` and
  `@domain/entity-currency-fiat` respectively, instead of `@shared/schema-primitives`. A primitives
  package has no business knowing about crypto, tokens or fiat.

  The crypto and token packages used to re-export these symbols from primitives, which made them
  proxies: two import paths for the same thing, and no obvious original provider. Consumers already
  importing from `@domain/entity-currency-*` are unaffected, since the symbols genuinely moved there.
  Anything importing them from `@shared/schema-primitives` must now import the owning domain package.

## 0.3.0

### Minor Changes

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

## 0.3.0-next.0

### Minor Changes

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

## 0.2.0

### Minor Changes

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

## 0.2.0-next.0

### Minor Changes

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

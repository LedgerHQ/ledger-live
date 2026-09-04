# @domain/entity-currency-token

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a)]:
  - @domain/entity-currency-crypto@0.11.0-next.0

## 0.5.0

### Minor Changes

- [#20693](https://github.com/LedgerHQ/ledger-live/pull/20693) [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): expose `tokenIdentifier` through `TokenCurrency`

## 0.5.0-next.0

### Minor Changes

- [#20693](https://github.com/LedgerHQ/ledger-live/pull/20693) [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): expose `tokenIdentifier` through `TokenCurrency`

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

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3)]:
  - @domain/entity-currency-crypto@0.10.0

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

### Patch Changes

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3)]:
  - @domain/entity-currency-crypto@0.10.0-next.0

## 0.3.0

### Minor Changes

- [#20048](https://github.com/LedgerHQ/ledger-live/pull/20048) [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c) Thanks [@ysitbon](https://github.com/ysitbon)! - Re-export CryptoCurrencyId / CryptoCurrencyIdSchema from @domain/entity-currency-crypto and TokenCurrencyId / TokenCurrencyIdSchema from @domain/entity-currency-token

## 0.3.0-next.0

### Minor Changes

- [#20048](https://github.com/LedgerHQ/ledger-live/pull/20048) [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c) Thanks [@ysitbon](https://github.com/ysitbon)! - Re-export CryptoCurrencyId / CryptoCurrencyIdSchema from @domain/entity-currency-crypto and TokenCurrencyId / TokenCurrencyIdSchema from @domain/entity-currency-token

## 0.2.0

### Minor Changes

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

### Patch Changes

- Updated dependencies [[`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e)]:
  - @domain/entity-currency-unit@0.3.0
  - @shared/schema-primitives@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

### Patch Changes

- Updated dependencies [[`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e)]:
  - @domain/entity-currency-unit@0.3.0-next.0
  - @shared/schema-primitives@0.3.0-next.0

## 0.1.0

### Minor Changes

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

### Patch Changes

- Updated dependencies [[`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6)]:
  - @shared/schema-primitives@0.2.0
  - @domain/entity-currency-unit@0.2.0

## 0.1.0-next.0

### Minor Changes

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

### Patch Changes

- Updated dependencies [[`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6)]:
  - @shared/schema-primitives@0.2.0-next.0
  - @domain/entity-currency-unit@0.2.0-next.0

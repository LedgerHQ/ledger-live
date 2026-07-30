# @domain/entity-currency

## 0.3.0-next.0

### Minor Changes

- [#20075](https://github.com/LedgerHQ/ledger-live/pull/20075) [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the specialized re-exports from `@domain/entity-currency`; it now exposes only the cross-package unions (`Currency`/`CurrencySchema`, `CryptoOrTokenCurrency`/`CryptoOrTokenCurrencySchema`). Import specialized types (`CryptoCurrency`, `TokenCurrency`, `FiatCurrency`, `Unit`) directly from their own `@domain/entity-currency-*` package.

### Patch Changes

- Updated dependencies [[`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c)]:
  - @domain/entity-currency-crypto@0.8.0-next.0
  - @domain/entity-currency-token@0.3.0-next.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6)]:
  - @domain/entity-currency-crypto@0.7.0

## 0.2.2-next.0

### Patch Changes

- Updated dependencies [[`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6)]:
  - @domain/entity-currency-crypto@0.7.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10)]:
  - @domain/entity-currency-crypto@0.6.0
  - @domain/entity-currency-fiat@0.3.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10)]:
  - @domain/entity-currency-crypto@0.6.0-next.0
  - @domain/entity-currency-fiat@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

### Patch Changes

- Updated dependencies [[`b837f65`](https://github.com/LedgerHQ/ledger-live/commit/b837f65b79b2d27b0b29d4037b18837c5a1b7ca5), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303)]:
  - @domain/entity-currency-fiat@0.2.0
  - @domain/entity-currency-crypto@0.5.0
  - @domain/entity-currency-token@0.2.0
  - @domain/entity-currency-unit@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

### Patch Changes

- Updated dependencies [[`b837f65`](https://github.com/LedgerHQ/ledger-live/commit/b837f65b79b2d27b0b29d4037b18837c5a1b7ca5), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303)]:
  - @domain/entity-currency-fiat@0.2.0-next.0
  - @domain/entity-currency-crypto@0.5.0-next.0
  - @domain/entity-currency-token@0.2.0-next.0
  - @domain/entity-currency-unit@0.3.0-next.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649)]:
  - @domain/entity-currency-crypto@0.4.0

## 0.1.3-next.0

### Patch Changes

- Updated dependencies [[`d149f27`](https://github.com/LedgerHQ/ledger-live/commit/d149f271f18a1727558fa046aa6bc38c391c2649)]:
  - @domain/entity-currency-crypto@0.4.0-next.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46)]:
  - @domain/entity-currency-crypto@0.3.0

## 0.1.2-next.0

### Patch Changes

- Updated dependencies [[`a61f904`](https://github.com/LedgerHQ/ledger-live/commit/a61f90478795bff6956d2a9083ec47d44e6e9a46)]:
  - @domain/entity-currency-crypto@0.3.0-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8)]:
  - @domain/entity-currency-crypto@0.2.0

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`1368afd`](https://github.com/LedgerHQ/ledger-live/commit/1368afdc7218a68c803672e6e412f8f9f6e62142), [`2257d43`](https://github.com/LedgerHQ/ledger-live/commit/2257d43630933127549300f39ade1e2b01f94cb8)]:
  - @domain/entity-currency-crypto@0.2.0-next.0

## 0.1.0

### Minor Changes

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

### Patch Changes

- Updated dependencies [[`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6)]:
  - @domain/entity-currency-crypto@0.1.0
  - @domain/entity-currency-fiat@0.1.0
  - @domain/entity-currency-token@0.1.0
  - @domain/entity-currency-unit@0.2.0

## 0.1.0-next.0

### Minor Changes

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

### Patch Changes

- Updated dependencies [[`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6)]:
  - @domain/entity-currency-crypto@0.1.0-next.0
  - @domain/entity-currency-fiat@0.1.0-next.0
  - @domain/entity-currency-token@0.1.0-next.0
  - @domain/entity-currency-unit@0.2.0-next.0

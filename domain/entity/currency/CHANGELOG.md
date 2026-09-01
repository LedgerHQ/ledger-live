# @domain/entity-currency

## 0.4.2-next.0

### Patch Changes

- Updated dependencies [[`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a)]:
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @domain/entity-currency-token@0.5.1-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @domain/entity-currency-token@0.5.0

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @domain/entity-currency-token@0.5.0-next.0

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

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3)]:
  - @domain/entity-currency-crypto@0.10.0
  - @domain/entity-currency-token@0.4.0
  - @domain/entity-currency-fiat@0.4.0

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

- Updated dependencies [[`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3)]:
  - @domain/entity-currency-crypto@0.10.0-next.0
  - @domain/entity-currency-token@0.4.0-next.0
  - @domain/entity-currency-fiat@0.4.0-next.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002)]:
  - @domain/entity-currency-crypto@0.9.0

## 0.3.1-next.0

### Patch Changes

- Updated dependencies [[`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002)]:
  - @domain/entity-currency-crypto@0.9.0-next.0

## 0.3.0

### Minor Changes

- [#20075](https://github.com/LedgerHQ/ledger-live/pull/20075) [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the specialized re-exports from `@domain/entity-currency`; it now exposes only the cross-package unions (`Currency`/`CurrencySchema`, `CryptoOrTokenCurrency`/`CryptoOrTokenCurrencySchema`). Import specialized types (`CryptoCurrency`, `TokenCurrency`, `FiatCurrency`, `Unit`) directly from their own `@domain/entity-currency-*` package.

### Patch Changes

- Updated dependencies [[`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c)]:
  - @domain/entity-currency-crypto@0.8.0
  - @domain/entity-currency-token@0.3.0

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

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

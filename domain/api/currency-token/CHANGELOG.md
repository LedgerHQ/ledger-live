# @domain/api-currency-token

## 0.2.1

### Patch Changes

- Updated dependencies [[`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10)]:
  - @domain/entity-currency-crypto@0.6.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10)]:
  - @domain/entity-currency-crypto@0.6.0-next.0

## 0.2.0

### Minor Changes

- [#19053](https://github.com/LedgerHQ/ledger-live/pull/19053) [`bb1bbc3`](https://github.com/LedgerHQ/ledger-live/commit/bb1bbc36d9c182ac2cefb92ec5e87f226bfc76fd) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@domain/api-currency-token`, the RTK Query client for token currencies backed by the Crypto
  Asset List (CAL): `cryptoAssetsApi` (`findTokenById`, `findTokenByAddressInCurrency`,
  `getTokensSyncHash`, `getTokensData`), the Zod token schema, the API→`TokenCurrency` converter
  (registry-based parent lookup) and the Zod-validated RTK Query persistence helpers. Service URLs,
  client version and an optional logger are injected via the store's thunk `extraArgument`
  (`calApiExtra`), so the package owns no env/config/logging dependency. Typed on
  `@domain/entity-currency-token` / `-crypto` / `-unit`; no `@ledgerhq/*` dependency.
  Not yet wired into the apps.

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

### Patch Changes

- Updated dependencies [[`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303)]:
  - @domain/entity-currency-crypto@0.5.0
  - @domain/entity-currency-token@0.2.0
  - @domain/entity-currency-unit@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#19053](https://github.com/LedgerHQ/ledger-live/pull/19053) [`bb1bbc3`](https://github.com/LedgerHQ/ledger-live/commit/bb1bbc36d9c182ac2cefb92ec5e87f226bfc76fd) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@domain/api-currency-token`, the RTK Query client for token currencies backed by the Crypto
  Asset List (CAL): `cryptoAssetsApi` (`findTokenById`, `findTokenByAddressInCurrency`,
  `getTokensSyncHash`, `getTokensData`), the Zod token schema, the API→`TokenCurrency` converter
  (registry-based parent lookup) and the Zod-validated RTK Query persistence helpers. Service URLs,
  client version and an optional logger are injected via the store's thunk `extraArgument`
  (`calApiExtra`), so the package owns no env/config/logging dependency. Typed on
  `@domain/entity-currency-token` / `-crypto` / `-unit`; no `@ledgerhq/*` dependency.
  Not yet wired into the apps.

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

### Patch Changes

- Updated dependencies [[`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303)]:
  - @domain/entity-currency-crypto@0.5.0-next.0
  - @domain/entity-currency-token@0.2.0-next.0
  - @domain/entity-currency-unit@0.3.0-next.0

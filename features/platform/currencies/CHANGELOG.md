# @features/platform-currencies

## 0.7.0-next.0

### Minor Changes

- [#21349](https://github.com/LedgerHQ/ledger-live/pull/21349) [`0df32c7`](https://github.com/LedgerHQ/ledger-live/commit/0df32c7f80d190522285002bfa6bffa0539f5b23) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(domain): add resilience to `null` and `undefined` responses from CAL

### Patch Changes

- Updated dependencies [[`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`0df32c7`](https://github.com/LedgerHQ/ledger-live/commit/0df32c7f80d190522285002bfa6bffa0539f5b23)]:
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @shared/api-services@0.6.0-next.0
  - @domain/api-currency-token@0.6.0-next.0
  - @domain/entity-currency-token@0.5.1-next.0
  - @features/platform-feature-flags@0.6.8-next.0

## 0.6.2

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0
  - @domain/api-currency-token@0.5.1
  - @features/platform-feature-flags@0.6.7

## 0.6.2-next.0

### Patch Changes

- Updated dependencies [[`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1)]:
  - @shared/api-services@0.5.0-next.0
  - @domain/api-currency-token@0.5.1-next.0
  - @features/platform-feature-flags@0.6.7-next.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @shared/api-services@0.4.0
  - @domain/entity-currency-token@0.5.0
  - @domain/api-currency-token@0.5.0
  - @features/platform-feature-flags@0.6.6

## 0.6.1-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-feature-flags@0.6.6-next.1

## 0.6.1-next.0

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @shared/api-services@0.4.0-next.0
  - @domain/entity-currency-token@0.5.0-next.0
  - @domain/api-currency-token@0.5.0-next.0
  - @features/platform-feature-flags@0.6.6-next.0

## 0.6.0

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
  - @domain/entity-currency-crypto@0.10.0
  - @domain/entity-currency-token@0.4.0
  - @domain/api-currency-token@0.4.0
  - @shared/api-services@0.3.0
  - @features/platform-feature-flags@0.6.5

## 0.6.0-next.0

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
  - @domain/entity-currency-crypto@0.10.0-next.0
  - @domain/entity-currency-token@0.4.0-next.0
  - @domain/api-currency-token@0.4.0-next.0
  - @shared/api-services@0.3.0-next.0
  - @features/platform-feature-flags@0.6.5-next.0

## 0.5.0

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

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

### Patch Changes

- Updated dependencies [[`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002)]:
  - @shared/api-services@0.2.0
  - @domain/api-currency-token@0.3.0
  - @domain/entity-currency-crypto@0.9.0
  - @features/platform-feature-flags@0.6.4

## 0.5.0-next.0

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

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

### Patch Changes

- Updated dependencies [[`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002)]:
  - @shared/api-services@0.2.0-next.0
  - @domain/api-currency-token@0.3.0-next.0
  - @domain/entity-currency-crypto@0.9.0-next.0
  - @features/platform-feature-flags@0.6.4-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c)]:
  - @domain/entity-currency-crypto@0.8.0
  - @domain/entity-currency-token@0.3.0
  - @domain/api-currency-token@0.2.3
  - @features/platform-feature-flags@0.6.3

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c)]:
  - @domain/entity-currency-crypto@0.8.0-next.0
  - @domain/entity-currency-token@0.3.0-next.0
  - @domain/api-currency-token@0.2.3-next.0
  - @features/platform-feature-flags@0.6.3-next.0

## 0.4.0

### Minor Changes

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19771](https://github.com/LedgerHQ/ledger-live/pull/19771) [`6b75426`](https://github.com/LedgerHQ/ledger-live/commit/6b7542690a99a365c4b80dfd1fe65e2be594494b) Thanks [@ysitbon](https://github.com/ysitbon)! - Declare `@reduxjs/toolkit` as a runtime dependency (moved from `devDependencies`). `buildStandaloneCryptoAssetsStore` calls `configureStore` at runtime, so consumers building a standalone store need RTK resolvable as a real dependency.

- [#19798](https://github.com/LedgerHQ/ledger-live/pull/19798) [`a55b810`](https://github.com/LedgerHQ/ledger-live/commit/a55b81007d49369f18b7ff15b6579c9a0d5de876) Thanks [@ysitbon](https://github.com/ysitbon)! - Add useCurrencyById and useTokenByAddressInCurrency hooks; repoint mobile from @ledgerhq/cryptoassets to @features/platform-currencies and @domain/entity-currency-crypto

### Patch Changes

- Updated dependencies [[`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6)]:
  - @domain/entity-currency-crypto@0.7.0
  - @domain/api-currency-token@0.2.2
  - @features/platform-feature-flags@0.6.2

## 0.4.0-next.0

### Minor Changes

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19771](https://github.com/LedgerHQ/ledger-live/pull/19771) [`6b75426`](https://github.com/LedgerHQ/ledger-live/commit/6b7542690a99a365c4b80dfd1fe65e2be594494b) Thanks [@ysitbon](https://github.com/ysitbon)! - Declare `@reduxjs/toolkit` as a runtime dependency (moved from `devDependencies`). `buildStandaloneCryptoAssetsStore` calls `configureStore` at runtime, so consumers building a standalone store need RTK resolvable as a real dependency.

- [#19798](https://github.com/LedgerHQ/ledger-live/pull/19798) [`a55b810`](https://github.com/LedgerHQ/ledger-live/commit/a55b81007d49369f18b7ff15b6579c9a0d5de876) Thanks [@ysitbon](https://github.com/ysitbon)! - Add useCurrencyById and useTokenByAddressInCurrency hooks; repoint mobile from @ledgerhq/cryptoassets to @features/platform-currencies and @domain/entity-currency-crypto

### Patch Changes

- Updated dependencies [[`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6)]:
  - @domain/entity-currency-crypto@0.7.0-next.0
  - @domain/api-currency-token@0.2.2-next.0
  - @features/platform-feature-flags@0.6.2-next.0

## 0.3.0

### Minor Changes

- [#19693](https://github.com/LedgerHQ/ledger-live/pull/19693) [`deaa7ba`](https://github.com/LedgerHQ/ledger-live/commit/deaa7ba622776b95b87aee9926b34e20a0dc818b) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `buildStandaloneCryptoAssetsStore` — a crypto-assets token store that configures its own Redux store, for runtimes without an application store (CLI scripts, monitoring jobs, integration-test setup). Complements `buildCryptoAssetsStore`, which binds to an existing store's `dispatch`.

### Patch Changes

- Updated dependencies [[`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10)]:
  - @domain/entity-currency-crypto@0.6.0
  - @features/platform-feature-flags@0.6.1
  - @domain/api-currency-token@0.2.1

## 0.3.0-next.0

### Minor Changes

- [#19693](https://github.com/LedgerHQ/ledger-live/pull/19693) [`deaa7ba`](https://github.com/LedgerHQ/ledger-live/commit/deaa7ba622776b95b87aee9926b34e20a0dc818b) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `buildStandaloneCryptoAssetsStore` — a crypto-assets token store that configures its own Redux store, for runtimes without an application store (CLI scripts, monitoring jobs, integration-test setup). Complements `buildCryptoAssetsStore`, which binds to an existing store's `dispatch`.

### Patch Changes

- Updated dependencies [[`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10)]:
  - @domain/entity-currency-crypto@0.6.0-next.0
  - @features/platform-feature-flags@0.6.1-next.0
  - @domain/api-currency-token@0.2.1-next.0

## 0.2.0

### Minor Changes

- [#19085](https://github.com/LedgerHQ/ledger-live/pull/19085) [`b1d2ae6`](https://github.com/LedgerHQ/ledger-live/commit/b1d2ae681e8dade5fc193911f1de0a898f65af1c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-currencies`, the app-facing currency runtime. Exports `buildCryptoAssetsStore` (the `CryptoAssetsStore` adapter over `@domain/api-currency-token`), a local `CryptoAssetsStore` port typed on the domain `TokenCurrency`, and the `useCryptoCurrencyById` / `useTokenById` / `useTokensData` / `useSupportedCurrencies` / `useFeatureFlaggedCurrencies` hooks. Supported-set resolution applies feature-flag gating via `@features/platform-feature-flags` over a registry-backed list (no own supported list). Runtime glue only — no slices; app-store wiring (single-source gate) is handled separately.

### Patch Changes

- Updated dependencies [[`bb1bbc3`](https://github.com/LedgerHQ/ledger-live/commit/bb1bbc36d9c182ac2cefb92ec5e87f226bfc76fd), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @domain/api-currency-token@0.2.0
  - @domain/entity-currency-crypto@0.5.0
  - @domain/entity-currency-token@0.2.0
  - @features/platform-feature-flags@0.6.0

## 0.2.0-next.0

### Minor Changes

- [#19085](https://github.com/LedgerHQ/ledger-live/pull/19085) [`b1d2ae6`](https://github.com/LedgerHQ/ledger-live/commit/b1d2ae681e8dade5fc193911f1de0a898f65af1c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-currencies`, the app-facing currency runtime. Exports `buildCryptoAssetsStore` (the `CryptoAssetsStore` adapter over `@domain/api-currency-token`), a local `CryptoAssetsStore` port typed on the domain `TokenCurrency`, and the `useCryptoCurrencyById` / `useTokenById` / `useTokensData` / `useSupportedCurrencies` / `useFeatureFlaggedCurrencies` hooks. Supported-set resolution applies feature-flag gating via `@features/platform-feature-flags` over a registry-backed list (no own supported list). Runtime glue only — no slices; app-store wiring (single-source gate) is handled separately.

### Patch Changes

- Updated dependencies [[`bb1bbc3`](https://github.com/LedgerHQ/ledger-live/commit/bb1bbc36d9c182ac2cefb92ec5e87f226bfc76fd), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @domain/api-currency-token@0.2.0-next.0
  - @domain/entity-currency-crypto@0.5.0-next.0
  - @domain/entity-currency-token@0.2.0-next.0
  - @features/platform-feature-flags@0.6.0-next.0

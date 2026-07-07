# @features/platform-currencies

## 0.2.0-next.0

### Minor Changes

- [#19085](https://github.com/LedgerHQ/ledger-live/pull/19085) [`b1d2ae6`](https://github.com/LedgerHQ/ledger-live/commit/b1d2ae681e8dade5fc193911f1de0a898f65af1c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-currencies`, the app-facing currency runtime. Exports `buildCryptoAssetsStore` (the `CryptoAssetsStore` adapter over `@domain/api-currency-token`), a local `CryptoAssetsStore` port typed on the domain `TokenCurrency`, and the `useCryptoCurrencyById` / `useTokenById` / `useTokensData` / `useSupportedCurrencies` / `useFeatureFlaggedCurrencies` hooks. Supported-set resolution applies feature-flag gating via `@features/platform-feature-flags` over a registry-backed list (no own supported list). Runtime glue only — no slices; app-store wiring (single-source gate) is handled separately.

### Patch Changes

- Updated dependencies [[`bb1bbc3`](https://github.com/LedgerHQ/ledger-live/commit/bb1bbc36d9c182ac2cefb92ec5e87f226bfc76fd), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @domain/api-currency-token@0.2.0-next.0
  - @domain/entity-currency-crypto@0.5.0-next.0
  - @domain/entity-currency-token@0.2.0-next.0
  - @features/platform-feature-flags@0.6.0-next.0

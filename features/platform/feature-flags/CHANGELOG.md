# @features/platform-feature-flags

## 0.4.0

### Minor Changes

- [#18237](https://github.com/LedgerHQ/ledger-live/pull/18237) [`8d79393`](https://github.com/LedgerHQ/ledger-live/commit/8d793937cfb5a2e7edb7234abcecc88102c10e6d) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate `@ledgerhq/live-common`'s internal feature-flag consumers off its React `featureFlags` Context module and `@ledgerhq/types-live` feature types, onto the Redux-backed `@shared/feature-flags` / `@features/platform-feature-flags` packages, and remove the `featureFlags` module along with the apps' now-inert `FeatureFlagsContextBridge`. Remaining external React consumers (both apps) are repointed to `@features/platform-feature-flags`; `@ledgerhq/live-dmk-desktop` receives its `ldmkTransport` flag via a prop instead of depending on the feature-flags package; non-React imperative reads use an injected getter or the relocated `live-common/firebase/featureFlags` reader. Adds the platform-specific `formatToFirebaseFeatureId` / `formatDefaultFeatures` to `@features/platform-feature-flags` and the generic `isValidFeatureId` to `@shared/feature-flags`. No behavioral change — resolved flag values are identical.

- [#18298](https://github.com/LedgerHQ/ledger-live/pull/18298) [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Extract `quickActionsCtasVariant` out of the `feature_lwm_wallet_40` feature flag into a dedicated `feature_lwm_quick_actions_ctas_variant` flag so the A/B test can run independently from other Wallet 4.0 parameters

### Patch Changes

- Updated dependencies [[`8d79393`](https://github.com/LedgerHQ/ledger-live/commit/8d793937cfb5a2e7edb7234abcecc88102c10e6d), [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`bbb92a1`](https://github.com/LedgerHQ/ledger-live/commit/bbb92a1efd4126343b5ef5a54605b9ca284d241c), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356)]:
  - @shared/feature-flags@0.11.0

## 0.4.0-next.1

### Patch Changes

- Updated dependencies [[`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9)]:
  - @shared/feature-flags@0.11.0-next.1

## 0.4.0-next.0

### Minor Changes

- [#18237](https://github.com/LedgerHQ/ledger-live/pull/18237) [`8d79393`](https://github.com/LedgerHQ/ledger-live/commit/8d793937cfb5a2e7edb7234abcecc88102c10e6d) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate `@ledgerhq/live-common`'s internal feature-flag consumers off its React `featureFlags` Context module and `@ledgerhq/types-live` feature types, onto the Redux-backed `@shared/feature-flags` / `@features/platform-feature-flags` packages, and remove the `featureFlags` module along with the apps' now-inert `FeatureFlagsContextBridge`. Remaining external React consumers (both apps) are repointed to `@features/platform-feature-flags`; `@ledgerhq/live-dmk-desktop` receives its `ldmkTransport` flag via a prop instead of depending on the feature-flags package; non-React imperative reads use an injected getter or the relocated `live-common/firebase/featureFlags` reader. Adds the platform-specific `formatToFirebaseFeatureId` / `formatDefaultFeatures` to `@features/platform-feature-flags` and the generic `isValidFeatureId` to `@shared/feature-flags`. No behavioral change — resolved flag values are identical.

- [#18298](https://github.com/LedgerHQ/ledger-live/pull/18298) [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Extract `quickActionsCtasVariant` out of the `feature_lwm_wallet_40` feature flag into a dedicated `feature_lwm_quick_actions_ctas_variant` flag so the A/B test can run independently from other Wallet 4.0 parameters

### Patch Changes

- Updated dependencies [[`8d79393`](https://github.com/LedgerHQ/ledger-live/commit/8d793937cfb5a2e7edb7234abcecc88102c10e6d), [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166), [`bbb92a1`](https://github.com/LedgerHQ/ledger-live/commit/bbb92a1efd4126343b5ef5a54605b9ca284d241c), [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356)]:
  - @shared/feature-flags@0.11.0-next.0

## 0.3.0

### Minor Changes

- [#17990](https://github.com/LedgerHQ/ledger-live/pull/17990) [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b) Thanks [@sarneijim](https://github.com/sarneijim)! - Extract onboarding widget control from `lwdWallet40` into a standalone `onboardingWidget` feature flag.

### Patch Changes

- Updated dependencies [[`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`36f16ea`](https://github.com/LedgerHQ/ledger-live/commit/36f16eae5fcf22706f5ed2dff4094178fc8d9ef8), [`7584ec2`](https://github.com/LedgerHQ/ledger-live/commit/7584ec2f10a173a768365befce8fcbd0baa4df87), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78)]:
  - @shared/feature-flags@0.10.0

## 0.3.0-next.0

### Minor Changes

- [#17990](https://github.com/LedgerHQ/ledger-live/pull/17990) [`d081ef1`](https://github.com/LedgerHQ/ledger-live/commit/d081ef1892a34fa1751fba4d774867ff11bae20b) Thanks [@sarneijim](https://github.com/sarneijim)! - Extract onboarding widget control from `lwdWallet40` into a standalone `onboardingWidget` feature flag.

### Patch Changes

- Updated dependencies [[`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339), [`36f16ea`](https://github.com/LedgerHQ/ledger-live/commit/36f16eae5fcf22706f5ed2dff4094178fc8d9ef8), [`7584ec2`](https://github.com/LedgerHQ/ledger-live/commit/7584ec2f10a173a768365befce8fcbd0baa4df87), [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33), [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78)]:
  - @shared/feature-flags@0.10.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`bff8280`](https://github.com/LedgerHQ/ledger-live/commit/bff8280159275bc7498e70f4e2a18962fb0ffbd0)]:
  - @shared/feature-flags@0.9.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c), [`bff8280`](https://github.com/LedgerHQ/ledger-live/commit/bff8280159275bc7498e70f4e2a18962fb0ffbd0)]:
  - @shared/feature-flags@0.9.0-next.0

## 0.2.0

### Minor Changes

- [#17239](https://github.com/LedgerHQ/ledger-live/pull/17239) [`934307d`](https://github.com/LedgerHQ/ledger-live/commit/934307d3df7712607efbdd143e454b3ce2766070) Thanks [@ysitbon](https://github.com/ysitbon)! - Introduce `@features/platform-feature-flags`: a Redux-backed React hooks layer over `@shared/feature-flags` that exposes `useFeature`, `useFeatureFlags`, `useHasLocallyOverriddenFeatureFlags`, `useWalletFeaturesConfig`, and `FeatureToggle` as a drop-in replacement for the Context-based hooks in `@ledgerhq/live-common/featureFlags`. This is the first package to land under `features/platform/`.

### Patch Changes

- Updated dependencies [[`00445f8`](https://github.com/LedgerHQ/ledger-live/commit/00445f8d035c6f4b04f05caa4a20748af087dbba), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554)]:
  - @shared/feature-flags@0.8.0

## 0.2.0-next.0

### Minor Changes

- [#17239](https://github.com/LedgerHQ/ledger-live/pull/17239) [`934307d`](https://github.com/LedgerHQ/ledger-live/commit/934307d3df7712607efbdd143e454b3ce2766070) Thanks [@ysitbon](https://github.com/ysitbon)! - Introduce `@features/platform-feature-flags`: a Redux-backed React hooks layer over `@shared/feature-flags` that exposes `useFeature`, `useFeatureFlags`, `useHasLocallyOverriddenFeatureFlags`, `useWalletFeaturesConfig`, and `FeatureToggle` as a drop-in replacement for the Context-based hooks in `@ledgerhq/live-common/featureFlags`. This is the first package to land under `features/platform/`.

### Patch Changes

- Updated dependencies [[`00445f8`](https://github.com/LedgerHQ/ledger-live/commit/00445f8d035c6f4b04f05caa4a20748af087dbba), [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02), [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f), [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111), [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554)]:
  - @shared/feature-flags@0.8.0-next.0

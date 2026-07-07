# @shared/feature-flags

## 0.13.0-next.0

### Minor Changes

- [#19015](https://github.com/LedgerHQ/ledger-live/pull/19015) [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm ledger sync feature flag clean up

- [#18887](https://github.com/LedgerHQ/ledger-live/pull/18887) [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the `concordiumVerifyAddress` feature flag and its "address verification unavailable" fallback. On-device address verification is now the unconditional path for all Concordium accounts.

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

- [#19259](https://github.com/LedgerHQ/ledger-live/pull/19259) [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - enable lwdWallet40 feature flag by default

- [#19062](https://github.com/LedgerHQ/ledger-live/pull/19062) [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Extract E2E test-support code out of `@ledgerhq/live-common`

  Moved the E2E enums, models, family helpers and speculos/device utilities that lived under
  `@ledgerhq/live-common/e2e/*` into a new dedicated, private package `@ledgerhq/live-e2e-shared`
  (located under `e2e/`, alongside the Desktop and Mobile E2E suites). This keeps test-only code
  out of `live-common`, which is in maintenance mode.

  - `@ledgerhq/live-common`: removed the internal `./e2e` export.
  - `@shared/feature-flags`: now exports `getAllFeatureFlags` (previously in the live-common e2e
    module), so production debug tooling no longer depends on test code.
  - `ledger-live-desktop`: the `devices` reducer now derives the Speculos device model from a small
    local map instead of importing from the e2e module.
  - Desktop/Mobile apps and E2E suites now import from `@ledgerhq/live-e2e-shared`.

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#19073](https://github.com/LedgerHQ/ledger-live/pull/19073) [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec) Thanks [@ysitbon](https://github.com/ysitbon)! - feature-flags: apply env (`FEATURE_FLAGS`) overrides at store boot even when the first remote-flags fetch fails. The middleware now re-resolves once on the first settled fetch — on success as before, and once on the first failure — so env (and version/language) resolution runs at boot without depending on a successful remote fetch. Subsequent failed polls do not re-resolve (a one-shot guard), so there is no per-poll churn. No app changes are required: any consumer of `createFeatureFlagsMiddleware` gets correct env-at-boot resolution.

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#18953](https://github.com/LedgerHQ/ledger-live/pull/18953) [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - opt-in notification feature flag clean up

- [#19130](https://github.com/LedgerHQ/ledger-live/pull/19130) [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926) Thanks [@sarneijim](https://github.com/sarneijim)! - Add shared `largeScreenUpsell` feature flag (off by default) as the single source of truth for the large-screen upsell audience, timing and modal content across Desktop and Mobile

- [#18994](https://github.com/LedgerHQ/ledger-live/pull/18994) [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Ledger Wallet dust filtering feature flags and platform hook.

- [#18936](https://github.com/LedgerHQ/ledger-live/pull/18936) [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - lldRebordABTest feature flag clean up

- [#19076](https://github.com/LedgerHQ/ledger-live/pull/19076) [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add lwdAnalyticsOptInScreenV2 feature flag

- [#18891](https://github.com/LedgerHQ/ledger-live/pull/18891) [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - flexibleContentCards feature flag cleanup

- [#18855](https://github.com/LedgerHQ/ledger-live/pull/18855) [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the `llmRebornLP` feature flag (always enabled with variant A) and inline the enabled behavior

- [#19003](https://github.com/LedgerHQ/ledger-live/pull/19003) [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `quickActionCtas` sub-flag of `lwdWallet40` (always enabled) and inline the enabled behavior: QuickActions are now always shown in the Portfolio and the legacy send/receive/exchange sidebar entries are removed

- [#18932](https://github.com/LedgerHQ/ledger-live/pull/18932) [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add an informational disclaimer banner on the Wallet 4.0 asset detail screen for assets supported exclusively on a Robinhood chain (e.g. tokenized stocks on robinhood_testnet). The banner is gated by the `llRobinhoodDisclaimer` feature flag, which is simplified to a plain boolean flag (its unused `url` param is removed).

- [#18971](https://github.com/LedgerHQ/ledger-live/pull/18971) [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the always-enabled `nanoOnboardingFundWallet` feature flag and clean up the dead onboarding tutorial code it gated (the `Aside` illustration sidebar, per-screen `Illustration`/`Footer` statics, related shared helpers, and orphaned i18n keys).

- [#18993](https://github.com/LedgerHQ/ledger-live/pull/18993) [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwd sync onboarding feature flag clean up

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

## 0.12.0

### Minor Changes

- [#18620](https://github.com/LedgerHQ/ledger-live/pull/18620) [`dd0be79`](https://github.com/LedgerHQ/ledger-live/commit/dd0be79ac4a388e9db17e349fbdf218f0a05a91f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add Q2 Tour on Portfolio with theme-aware slide images, Figma copy, persisted hasSeen state, and lwdWallet40 q2Tour flag

- [#18550](https://github.com/LedgerHQ/ledger-live/pull/18550) [`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add swapEntryPoint tracking field and ptxSwapLiveAppOnAsset feature flag

- [#19098](https://github.com/LedgerHQ/ledger-live/pull/19098) [`98eb6d6`](https://github.com/LedgerHQ/ledger-live/commit/98eb6d636e8cbcf1ed35449f7070ac2a84b8b148) Thanks [@ysitbon](https://github.com/ysitbon)! - feature-flags: apply env (`FEATURE_FLAGS`) overrides at store boot even when the first remote-flags fetch fails. The middleware now re-resolves once on the first settled fetch — on success as before, and once on the first failure — so env (and version/language) resolution runs at boot without depending on a successful remote fetch. Subsequent failed polls do not re-resolve (a one-shot guard), so there is no per-poll churn. No app changes are required: any consumer of `createFeatureFlagsMiddleware` gets correct env-at-boot resolution.

- [#18681](https://github.com/LedgerHQ/ledger-live/pull/18681) [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove llmAnalyticsOptInPrompt feature flag and unused variant B code

- [#18660](https://github.com/LedgerHQ/ledger-live/pull/18660) [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove "llmHomescreen" feature flag and legacy code in lwm

- [#18572](https://github.com/LedgerHQ/ledger-live/pull/18572) [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

- [#18604](https://github.com/LedgerHQ/ledger-live/pull/18604) [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add foundation for the image-based Q2 Wallet V4 Tour: new `q2Tour` parameter on the `lwmWallet40` feature flag and a persisted `hasSeenQ2WalletV4Tour` mobile settings flag

- [#18669](https://github.com/LedgerHQ/ledger-live/pull/18669) [`94923e3`](https://github.com/LedgerHQ/ledger-live/commit/94923e36342b58ebd4754ce41324680bd9eb1bfd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add robinhood disclaimer ff

- [#18011](https://github.com/LedgerHQ/ledger-live/pull/18011) [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8) Thanks [@hhumphrey-ledger](https://github.com/hhumphrey-ledger)! - Forward on the currencyId to the earn deposit screen to support the swap to earn feature

## 0.12.0-next.2

### Minor Changes

- [#19098](https://github.com/LedgerHQ/ledger-live/pull/19098) [`98eb6d6`](https://github.com/LedgerHQ/ledger-live/commit/98eb6d636e8cbcf1ed35449f7070ac2a84b8b148) Thanks [@ysitbon](https://github.com/ysitbon)! - feature-flags: apply env (`FEATURE_FLAGS`) overrides at store boot even when the first remote-flags fetch fails. The middleware now re-resolves once on the first settled fetch — on success as before, and once on the first failure — so env (and version/language) resolution runs at boot without depending on a successful remote fetch. Subsequent failed polls do not re-resolve (a one-shot guard), so there is no per-poll churn. No app changes are required: any consumer of `createFeatureFlagsMiddleware` gets correct env-at-boot resolution.

## 0.12.0-next.1

### Minor Changes

- [#18550](https://github.com/LedgerHQ/ledger-live/pull/18550) [`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add swapEntryPoint tracking field and ptxSwapLiveAppOnAsset feature flag

## 0.12.0-next.0

### Minor Changes

- [#18620](https://github.com/LedgerHQ/ledger-live/pull/18620) [`dd0be79`](https://github.com/LedgerHQ/ledger-live/commit/dd0be79ac4a388e9db17e349fbdf218f0a05a91f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add Q2 Tour on Portfolio with theme-aware slide images, Figma copy, persisted hasSeen state, and lwdWallet40 q2Tour flag

- [#18681](https://github.com/LedgerHQ/ledger-live/pull/18681) [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove llmAnalyticsOptInPrompt feature flag and unused variant B code

- [#18660](https://github.com/LedgerHQ/ledger-live/pull/18660) [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove "llmHomescreen" feature flag and legacy code in lwm

- [#18572](https://github.com/LedgerHQ/ledger-live/pull/18572) [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

- [#18604](https://github.com/LedgerHQ/ledger-live/pull/18604) [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add foundation for the image-based Q2 Wallet V4 Tour: new `q2Tour` parameter on the `lwmWallet40` feature flag and a persisted `hasSeenQ2WalletV4Tour` mobile settings flag

- [#18669](https://github.com/LedgerHQ/ledger-live/pull/18669) [`94923e3`](https://github.com/LedgerHQ/ledger-live/commit/94923e36342b58ebd4754ce41324680bd9eb1bfd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add robinhood disclaimer ff

- [#18011](https://github.com/LedgerHQ/ledger-live/pull/18011) [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8) Thanks [@hhumphrey-ledger](https://github.com/hhumphrey-ledger)! - Forward on the currencyId to the earn deposit screen to support the swap to earn feature

## 0.11.0

### Minor Changes

- [#18237](https://github.com/LedgerHQ/ledger-live/pull/18237) [`8d79393`](https://github.com/LedgerHQ/ledger-live/commit/8d793937cfb5a2e7edb7234abcecc88102c10e6d) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate `@ledgerhq/live-common`'s internal feature-flag consumers off its React `featureFlags` Context module and `@ledgerhq/types-live` feature types, onto the Redux-backed `@shared/feature-flags` / `@features/platform-feature-flags` packages, and remove the `featureFlags` module along with the apps' now-inert `FeatureFlagsContextBridge`. Remaining external React consumers (both apps) are repointed to `@features/platform-feature-flags`; `@ledgerhq/live-dmk-desktop` receives its `ldmkTransport` flag via a prop instead of depending on the feature-flags package; non-React imperative reads use an injected getter or the relocated `live-common/firebase/featureFlags` reader. Adds the platform-specific `formatToFirebaseFeatureId` / `formatDefaultFeatures` to `@features/platform-feature-flags` and the generic `isValidFeatureId` to `@shared/feature-flags`. No behavioral change — resolved flag values are identical.

- [#18642](https://github.com/LedgerHQ/ledger-live/pull/18642) [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

- [#18298](https://github.com/LedgerHQ/ledger-live/pull/18298) [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Extract `quickActionsCtasVariant` out of the `feature_lwm_wallet_40` feature flag into a dedicated `feature_lwm_quick_actions_ctas_variant` flag so the A/B test can run independently from other Wallet 4.0 parameters

- [#18402](https://github.com/LedgerHQ/ledger-live/pull/18402) [`bbb92a1`](https://github.com/LedgerHQ/ledger-live/commit/bbb92a1efd4126343b5ef5a54605b9ca284d241c) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove welcomeScreenVideoCarousel feature flag (always enabled)

- [#17997](https://github.com/LedgerHQ/ledger-live/pull/17997) [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356) Thanks [@Justkant](https://github.com/Justkant)! - Harden custom deeplink opening behind platform feature flags.

## 0.11.0-next.1

### Minor Changes

- [#18642](https://github.com/LedgerHQ/ledger-live/pull/18642) [`93a5bcd`](https://github.com/LedgerHQ/ledger-live/commit/93a5bcd8b7e361148f7bac751d072cc8bcec2cf9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

## 0.11.0-next.0

### Minor Changes

- [#18237](https://github.com/LedgerHQ/ledger-live/pull/18237) [`8d79393`](https://github.com/LedgerHQ/ledger-live/commit/8d793937cfb5a2e7edb7234abcecc88102c10e6d) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate `@ledgerhq/live-common`'s internal feature-flag consumers off its React `featureFlags` Context module and `@ledgerhq/types-live` feature types, onto the Redux-backed `@shared/feature-flags` / `@features/platform-feature-flags` packages, and remove the `featureFlags` module along with the apps' now-inert `FeatureFlagsContextBridge`. Remaining external React consumers (both apps) are repointed to `@features/platform-feature-flags`; `@ledgerhq/live-dmk-desktop` receives its `ldmkTransport` flag via a prop instead of depending on the feature-flags package; non-React imperative reads use an injected getter or the relocated `live-common/firebase/featureFlags` reader. Adds the platform-specific `formatToFirebaseFeatureId` / `formatDefaultFeatures` to `@features/platform-feature-flags` and the generic `isValidFeatureId` to `@shared/feature-flags`. No behavioral change — resolved flag values are identical.

- [#18298](https://github.com/LedgerHQ/ledger-live/pull/18298) [`e6c617b`](https://github.com/LedgerHQ/ledger-live/commit/e6c617b91062f82f70d020212189a806d2452166) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Extract `quickActionsCtasVariant` out of the `feature_lwm_wallet_40` feature flag into a dedicated `feature_lwm_quick_actions_ctas_variant` flag so the A/B test can run independently from other Wallet 4.0 parameters

- [#18402](https://github.com/LedgerHQ/ledger-live/pull/18402) [`bbb92a1`](https://github.com/LedgerHQ/ledger-live/commit/bbb92a1efd4126343b5ef5a54605b9ca284d241c) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove welcomeScreenVideoCarousel feature flag (always enabled)

- [#17997](https://github.com/LedgerHQ/ledger-live/pull/17997) [`04e3349`](https://github.com/LedgerHQ/ledger-live/commit/04e33498ffd5d7a81ad86436a75b1562ca263356) Thanks [@Justkant](https://github.com/Justkant)! - Harden custom deeplink opening behind platform feature flags.

## 0.10.0

### Minor Changes

- [#18027](https://github.com/LedgerHQ/ledger-live/pull/18027) [`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add notification drawer prompt target contracts

- [#18045](https://github.com/LedgerHQ/ledger-live/pull/18045) [`36f16ea`](https://github.com/LedgerHQ/ledger-live/commit/36f16eae5fcf22706f5ed2dff4094178fc8d9ef8) Thanks [@ysitbon](https://github.com/ysitbon)! - Add a Redux-backed `remoteFlagsReady` boot-readiness signal: a `remoteFlagsReady` state field (initial `false`), an idempotent `setRemoteFlagsReady` reducer, and a `selectRemoteFlagsReady` selector. The middleware dispatches the signal once after the first remote-flag fetch settles — success or failure. The field is transient and never persisted, so it re-arms every session.

- [#18174](https://github.com/LedgerHQ/ledger-live/pull/18174) [`7584ec2`](https://github.com/LedgerHQ/ledger-live/commit/7584ec2f10a173a768365befce8fcbd0baa4df87) Thanks [@ysitbon](https://github.com/ysitbon)! - Apply feature-flag language filtering. The feature-flags middleware now injects the current app language into `meta.resolutionConfig.appLanguage` on every `featureFlags/*` action — read from app state via an optional `getAppLanguage` selector — and re-resolves all flags when it changes, so `languages_whitelisted` / `languages_blacklisted` constraints take effect.

- [#18204](https://github.com/LedgerHQ/ledger-live/pull/18204) [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add `lwmBackupHub` / `lwdBackupHub` Engagement feature flags (default disabled) for the Recover Backup Hub initiative, and reserve CODEOWNERS ownership of the upcoming BackupHub MVVM folders.

- [#18163](https://github.com/LedgerHQ/ledger-live/pull/18163) [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78) Thanks [@vcluzeau-ledger](https://github.com/vcluzeau-ledger)! - Make Recover URI templating actually replace `protectId`, drop unused `protectServicesDesktop` / `protectServicesMobile` params, and replace `compatibleDevices` with a hardcoded Nano S exclusion in `isRecoverDisplayed`.

  `useReplacedURI` previously only rewrote the placeholders `protect-simu`, `protect-local-dev` and `protect-staging`, so any URI hard-coded with `protect-prod` (e.g. the values shipped to PROD via Firebase Remote Config) was never re-templated when `protectId` changed. Switching the active Recover environment therefore required a manual find-and-replace across every URI in the feature flag. The regex now matches any `protect-<env>` segment, which is a no-op when `protectId` already equals that segment and a true substitution otherwise.

  `compatibleDevices` is replaced by a hardcoded check in `isRecoverDisplayed` — Nano S is the only device that does not support Recover and the rule is not expected to change. Dropping the array from the schema keeps the FF lean and removes the need to update Remote Config when a new device is supported.

  Also remove keys that have no consumer in either app — `isNew`, `ledgerliveStorageState`, `onboardingCompleted.alreadySubscribedURI`, and the entire `onboardingRestore` block on desktop; `ledgerliveStorageState`, `restoreInfoDrawer.manualStepsURI`, `managerStatesData.NEW.learnMoreURI` and `managerStatesData.NEW.alreadySubscribedURI` on mobile. `usePostOnboardingURI` is narrowed to `Feature_ProtectServicesMobile` since it is only called from the mobile app. Unknown keys still in Firebase are silently stripped by Zod, so this is forward-compatible with existing Remote Config payloads.

## 0.10.0-next.0

### Minor Changes

- [#18027](https://github.com/LedgerHQ/ledger-live/pull/18027) [`c606898`](https://github.com/LedgerHQ/ledger-live/commit/c606898e4994768eadd99f2dea9575f92b3f9339) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add notification drawer prompt target contracts

- [#18045](https://github.com/LedgerHQ/ledger-live/pull/18045) [`36f16ea`](https://github.com/LedgerHQ/ledger-live/commit/36f16eae5fcf22706f5ed2dff4094178fc8d9ef8) Thanks [@ysitbon](https://github.com/ysitbon)! - Add a Redux-backed `remoteFlagsReady` boot-readiness signal: a `remoteFlagsReady` state field (initial `false`), an idempotent `setRemoteFlagsReady` reducer, and a `selectRemoteFlagsReady` selector. The middleware dispatches the signal once after the first remote-flag fetch settles — success or failure. The field is transient and never persisted, so it re-arms every session.

- [#18174](https://github.com/LedgerHQ/ledger-live/pull/18174) [`7584ec2`](https://github.com/LedgerHQ/ledger-live/commit/7584ec2f10a173a768365befce8fcbd0baa4df87) Thanks [@ysitbon](https://github.com/ysitbon)! - Apply feature-flag language filtering. The feature-flags middleware now injects the current app language into `meta.resolutionConfig.appLanguage` on every `featureFlags/*` action — read from app state via an optional `getAppLanguage` selector — and re-resolves all flags when it changes, so `languages_whitelisted` / `languages_blacklisted` constraints take effect.

- [#18204](https://github.com/LedgerHQ/ledger-live/pull/18204) [`d649cf3`](https://github.com/LedgerHQ/ledger-live/commit/d649cf31ecf8b2e18ab78109e6b201ff9766cc33) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add `lwmBackupHub` / `lwdBackupHub` Engagement feature flags (default disabled) for the Recover Backup Hub initiative, and reserve CODEOWNERS ownership of the upcoming BackupHub MVVM folders.

- [#18163](https://github.com/LedgerHQ/ledger-live/pull/18163) [`ddfb84c`](https://github.com/LedgerHQ/ledger-live/commit/ddfb84cf0caf68cfaba75aa7c015b2029051fe78) Thanks [@vcluzeau-ledger](https://github.com/vcluzeau-ledger)! - Make Recover URI templating actually replace `protectId`, drop unused `protectServicesDesktop` / `protectServicesMobile` params, and replace `compatibleDevices` with a hardcoded Nano S exclusion in `isRecoverDisplayed`.

  `useReplacedURI` previously only rewrote the placeholders `protect-simu`, `protect-local-dev` and `protect-staging`, so any URI hard-coded with `protect-prod` (e.g. the values shipped to PROD via Firebase Remote Config) was never re-templated when `protectId` changed. Switching the active Recover environment therefore required a manual find-and-replace across every URI in the feature flag. The regex now matches any `protect-<env>` segment, which is a no-op when `protectId` already equals that segment and a true substitution otherwise.

  `compatibleDevices` is replaced by a hardcoded check in `isRecoverDisplayed` — Nano S is the only device that does not support Recover and the rule is not expected to change. Dropping the array from the schema keeps the FF lean and removes the need to update Remote Config when a new device is supported.

  Also remove keys that have no consumer in either app — `isNew`, `ledgerliveStorageState`, `onboardingCompleted.alreadySubscribedURI`, and the entire `onboardingRestore` block on desktop; `ledgerliveStorageState`, `restoreInfoDrawer.manualStepsURI`, `managerStatesData.NEW.learnMoreURI` and `managerStatesData.NEW.alreadySubscribedURI` on mobile. `usePostOnboardingURI` is narrowed to `Feature_ProtectServicesMobile` since it is only called from the mobile app. Unknown keys still in Firebase are silently stripped by Zod, so this is forward-compatible with existing Remote Config payloads.

## 0.9.0

### Minor Changes

- [#17837](https://github.com/LedgerHQ/ledger-live/pull/17837) [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm - lwd feature flag for counterfeit warning

- [#17765](https://github.com/LedgerHQ/ledger-live/pull/17765) [`bff8280`](https://github.com/LedgerHQ/ledger-live/commit/bff8280159275bc7498e70f4e2a18962fb0ffbd0) Thanks [@ysitbon](https://github.com/ysitbon)! - Tighten `flagWithRecord` so `Features[K].params` infers the record's value type instead of collapsing to `unknown`. Consumers indexing into a `flagWithRecord`-backed flag (e.g. `receiveStakingFlowConfigDesktop.params[currencyId]`) now get the proper schema-derived type without needing a cast.

## 0.9.0-next.0

### Minor Changes

- [#17837](https://github.com/LedgerHQ/ledger-live/pull/17837) [`177e07f`](https://github.com/LedgerHQ/ledger-live/commit/177e07ffc6c733b4b9811d6f7dff6b75a106075c) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm - lwd feature flag for counterfeit warning

- [#17765](https://github.com/LedgerHQ/ledger-live/pull/17765) [`bff8280`](https://github.com/LedgerHQ/ledger-live/commit/bff8280159275bc7498e70f4e2a18962fb0ffbd0) Thanks [@ysitbon](https://github.com/ysitbon)! - Tighten `flagWithRecord` so `Features[K].params` infers the record's value type instead of collapsing to `unknown`. Consumers indexing into a `flagWithRecord`-backed flag (e.g. `receiveStakingFlowConfigDesktop.params[currencyId]`) now get the proper schema-derived type without needing a cast.

## 0.8.0

### Minor Changes

- [#17693](https://github.com/LedgerHQ/ledger-live/pull/17693) [`00445f8`](https://github.com/LedgerHQ/ledger-live/commit/00445f8d035c6f4b04f05caa4a20748af087dbba) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix default values for wallet v4 params related to Q2

- [#17542](https://github.com/LedgerHQ/ledger-live/pull/17542) [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Add lwmAnalyticsConsentOnboarding feature flag (default disabled) for mobile

- [#17654](https://github.com/LedgerHQ/ledger-live/pull/17654) [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: remove sonic blaze feature flags

- [#17560](https://github.com/LedgerHQ/ledger-live/pull/17560) [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Move Concordium ID App store links (App Store / Google Play) to a new `concordiumIdAppLinks` feature flag with runtime override support via Firebase

- [#17635](https://github.com/LedgerHQ/ledger-live/pull/17635) [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm feature flag for new notification opt in

## 0.8.0-next.0

### Minor Changes

- [#17693](https://github.com/LedgerHQ/ledger-live/pull/17693) [`00445f8`](https://github.com/LedgerHQ/ledger-live/commit/00445f8d035c6f4b04f05caa4a20748af087dbba) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix default values for wallet v4 params related to Q2

- [#17542](https://github.com/LedgerHQ/ledger-live/pull/17542) [`a04a4c0`](https://github.com/LedgerHQ/ledger-live/commit/a04a4c0a8bbee5140f685836014409e98af33d02) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Add lwmAnalyticsConsentOnboarding feature flag (default disabled) for mobile

- [#17654](https://github.com/LedgerHQ/ledger-live/pull/17654) [`9b75461`](https://github.com/LedgerHQ/ledger-live/commit/9b754610e67e4d31d3d49b566ba1590194265c6f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore: remove sonic blaze feature flags

- [#17560](https://github.com/LedgerHQ/ledger-live/pull/17560) [`9ccd154`](https://github.com/LedgerHQ/ledger-live/commit/9ccd1540f6ea912107d9651fa9b66ffd12948111) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Move Concordium ID App store links (App Store / Google Play) to a new `concordiumIdAppLinks` feature flag with runtime override support via Firebase

- [#17635](https://github.com/LedgerHQ/ledger-live/pull/17635) [`603f343`](https://github.com/LedgerHQ/ledger-live/commit/603f343d64c9b69a5708b419eb7ebfe7cec94554) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm feature flag for new notification opt in

## 0.7.0

### Minor Changes

- [#17106](https://github.com/LedgerHQ/ledger-live/pull/17106) [`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile push notification prompt after DApp transaction completion

- [#17096](https://github.com/LedgerHQ/ledger-live/pull/17096) [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb) Thanks [@ishaba](https://github.com/ishaba)! - Add GraphQL read-side transport for Sui (balances, stakes, lastBlock, checkpoint) behind the `suiGraphqlTransport` feature flag.

- [#17320](https://github.com/LedgerHQ/ledger-live/pull/17320) [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add PnL feature flag param to wallet40 feature flags

## 0.7.0-next.0

### Minor Changes

- [#17106](https://github.com/LedgerHQ/ledger-live/pull/17106) [`f39fede`](https://github.com/LedgerHQ/ledger-live/commit/f39fede0a6eb4e427a15219e5a3c8fbc3302815f) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile push notification prompt after DApp transaction completion

- [#17096](https://github.com/LedgerHQ/ledger-live/pull/17096) [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb) Thanks [@ishaba](https://github.com/ishaba)! - Add GraphQL read-side transport for Sui (balances, stakes, lastBlock, checkpoint) behind the `suiGraphqlTransport` feature flag.

- [#17320](https://github.com/LedgerHQ/ledger-live/pull/17320) [`3cd7abb`](https://github.com/LedgerHQ/ledger-live/commit/3cd7abb4d6f6072bad62073108d797faf23f9e8c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add PnL feature flag param to wallet40 feature flags

## 0.6.0

### Minor Changes

- [#16655](https://github.com/LedgerHQ/ledger-live/pull/16655) [`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `lwmProductTour` feature flag under `team-engagement` (off by default), persisted `productTourCompleted` in mobile settings, and a QA-focused Product Tour block under Settings → Debug → Wallet V4 features. [LIVE-28094](https://ledgerhq.atlassian.net/browse/LIVE-28094)

- [#17031](https://github.com/LedgerHQ/ledger-live/pull/17031) [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(ff): update newSendFlow FF to includes excludedCurrencyIds

- [#16786](https://github.com/LedgerHQ/ledger-live/pull/16786) [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix feature falg for new AB test POC

- [#16637](https://github.com/LedgerHQ/ledger-live/pull/16637) [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Firebase A/B testing POC for the Transfer entry button and bottom sheet copy on mobile via the new `transferButtonCopyVariant` feature flag

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

- [#16867](https://github.com/LedgerHQ/ledger-live/pull/16867) [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190) Thanks [@cfloume](https://github.com/cfloume)! - feat: add generic awareness modal feature flags

## 0.6.0-next.0

### Minor Changes

- [#16655](https://github.com/LedgerHQ/ledger-live/pull/16655) [`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `lwmProductTour` feature flag under `team-engagement` (off by default), persisted `productTourCompleted` in mobile settings, and a QA-focused Product Tour block under Settings → Debug → Wallet V4 features. [LIVE-28094](https://ledgerhq.atlassian.net/browse/LIVE-28094)

- [#17031](https://github.com/LedgerHQ/ledger-live/pull/17031) [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(ff): update newSendFlow FF to includes excludedCurrencyIds

- [#16786](https://github.com/LedgerHQ/ledger-live/pull/16786) [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix feature falg for new AB test POC

- [#16637](https://github.com/LedgerHQ/ledger-live/pull/16637) [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Firebase A/B testing POC for the Transfer entry button and bottom sheet copy on mobile via the new `transferButtonCopyVariant` feature flag

- [#16799](https://github.com/LedgerHQ/ledger-live/pull/16799) [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.

- [#16867](https://github.com/LedgerHQ/ledger-live/pull/16867) [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190) Thanks [@cfloume](https://github.com/cfloume)! - feat: add generic awareness modal feature flags

## 0.5.0

### Minor Changes

- [#16358](https://github.com/LedgerHQ/ledger-live/pull/16358) [`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95) Thanks [@sarneijim](https://github.com/sarneijim)! - Add finish onboarding widget flag (lwdWallet40), shared post-onboarding portfolio visibility hook, and desktop portfolio banner priority with slot for the new widget UI.

- [#16240](https://github.com/LedgerHQ/ledger-live/pull/16240) [`093017c`](https://github.com/LedgerHQ/ledger-live/commit/093017c2743cc634dfe328f5d28c35df1eae6429) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read analytics consent policy version and validity window from `analyticsOptIn` feature-flag params; drop `privacyConsent` constant; add `saveAnalyticsConsentInfo` action and dedicated reducer handling on desktop.

## 0.5.0-next.0

### Minor Changes

- [#16358](https://github.com/LedgerHQ/ledger-live/pull/16358) [`fbff5f4`](https://github.com/LedgerHQ/ledger-live/commit/fbff5f407027cb2b24834fea53ef21a3ef93bf95) Thanks [@sarneijim](https://github.com/sarneijim)! - Add finish onboarding widget flag (lwdWallet40), shared post-onboarding portfolio visibility hook, and desktop portfolio banner priority with slot for the new widget UI.

- [#16240](https://github.com/LedgerHQ/ledger-live/pull/16240) [`093017c`](https://github.com/LedgerHQ/ledger-live/commit/093017c2743cc634dfe328f5d28c35df1eae6429) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read analytics consent policy version and validity window from `analyticsOptIn` feature-flag params; drop `privacyConsent` constant; add `saveAnalyticsConsentInfo` action and dedicated reducer handling on desktop.

## 0.4.0

### Minor Changes

- [#16096](https://github.com/LedgerHQ/ledger-live/pull/16096) [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add aggregatedAssets FF for W4.0

- [#16098](https://github.com/LedgerHQ/ledger-live/pull/16098) [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839) Thanks [@deepyjr](https://github.com/deepyjr)! - Add myWallet feature flag param to lwdWallet40 and lwmWallet40 for targeted rollout control of the My Wallet navigation component

## 0.4.0-next.0

### Minor Changes

- [#16096](https://github.com/LedgerHQ/ledger-live/pull/16096) [`97d7278`](https://github.com/LedgerHQ/ledger-live/commit/97d727824cef6a5b5a2d034d9b029e4f977f1754) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add aggregatedAssets FF for W4.0

- [#16098](https://github.com/LedgerHQ/ledger-live/pull/16098) [`63b5b9a`](https://github.com/LedgerHQ/ledger-live/commit/63b5b9a3f3b88fa41f02983350cdb6e73a887839) Thanks [@deepyjr](https://github.com/deepyjr)! - Add myWallet feature flag param to lwdWallet40 and lwmWallet40 for targeted rollout control of the My Wallet navigation component

## 0.3.0

### Minor Changes

- [#15944](https://github.com/LedgerHQ/ledger-live/pull/15944) [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab) Thanks [@sarneijim](https://github.com/sarneijim)! - Add mobile analytics opt-in consent drawer, analyticsOptIn feature flag, and settings integration

- [#15236](https://github.com/LedgerHQ/ledger-live/pull/15236) [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(libs): prepare lldHideSmallValueTokenOperations FF

- [#15953](https://github.com/LedgerHQ/ledger-live/pull/15953) [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(feature-flag): feature flag and descriptor for native evm staking

- [#15846](https://github.com/LedgerHQ/ledger-live/pull/15846) [`2dcc09e`](https://github.com/LedgerHQ/ledger-live/commit/2dcc09ed5eaca7c74018585c5d6875db22db5b80) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwd update lns upsell banner

## 0.3.0-next.0

### Minor Changes

- [#15944](https://github.com/LedgerHQ/ledger-live/pull/15944) [`ea34195`](https://github.com/LedgerHQ/ledger-live/commit/ea34195c1115aaa40c69259ee2d2ee581e0349ab) Thanks [@sarneijim](https://github.com/sarneijim)! - Add mobile analytics opt-in consent drawer, analyticsOptIn feature flag, and settings integration

- [#15236](https://github.com/LedgerHQ/ledger-live/pull/15236) [`7ffc0c5`](https://github.com/LedgerHQ/ledger-live/commit/7ffc0c5a7623aea32cdff2e093c14fae87352e71) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(libs): prepare lldHideSmallValueTokenOperations FF

- [#15953](https://github.com/LedgerHQ/ledger-live/pull/15953) [`55c01bc`](https://github.com/LedgerHQ/ledger-live/commit/55c01bcd8e43f9a54e93a41bb383d6d5c633b35f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(feature-flag): feature flag and descriptor for native evm staking

- [#15846](https://github.com/LedgerHQ/ledger-live/pull/15846) [`2dcc09e`](https://github.com/LedgerHQ/ledger-live/commit/2dcc09ed5eaca7c74018585c5d6875db22db5b80) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwd update lns upsell banner

## 0.2.0

### Minor Changes

- [#15605](https://github.com/LedgerHQ/ledger-live/pull/15605) [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - introduce operationList FF for W4

- [#15641](https://github.com/LedgerHQ/ledger-live/pull/15641) [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - feat: add `mantle` and `mantle_sepolia` EVM networks

## 0.2.0-next.0

### Minor Changes

- [#15605](https://github.com/LedgerHQ/ledger-live/pull/15605) [`1bf4e7e`](https://github.com/LedgerHQ/ledger-live/commit/1bf4e7efa2fbb310f9c3db8f5d72e68294f0f3fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - introduce operationList FF for W4

- [#15641](https://github.com/LedgerHQ/ledger-live/pull/15641) [`deec161`](https://github.com/LedgerHQ/ledger-live/commit/deec16153656d444336f067970dcda5fff016d95) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - feat: add `mantle` and `mantle_sepolia` EVM networks

## 0.1.0

### Minor Changes

- [#15446](https://github.com/LedgerHQ/ledger-live/pull/15446) [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41) Thanks [@cfloume](https://github.com/cfloume)! - chore: remove postOnboardingAssetsTransfer feature flag (default to true)

## 0.1.0-next.0

### Minor Changes

- [#15446](https://github.com/LedgerHQ/ledger-live/pull/15446) [`3ede91a`](https://github.com/LedgerHQ/ledger-live/commit/3ede91a3674a80c9309d305b871ec3b6e9849b41) Thanks [@cfloume](https://github.com/cfloume)! - chore: remove postOnboardingAssetsTransfer feature flag (default to true)

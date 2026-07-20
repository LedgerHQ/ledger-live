# @features/platform-feature-flags

## 0.6.1-next.0

### Patch Changes

- Updated dependencies [[`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @shared/feature-flags@0.14.0-next.0

## 0.6.0

### Minor Changes

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#18994](https://github.com/LedgerHQ/ledger-live/pull/18994) [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Ledger Wallet dust filtering feature flags and platform hook.

- [#19003](https://github.com/LedgerHQ/ledger-live/pull/19003) [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `quickActionCtas` sub-flag of `lwdWallet40` (always enabled) and inline the enabled behavior: QuickActions are now always shown in the Portfolio and the legacy send/receive/exchange sidebar entries are removed

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

### Patch Changes

- Updated dependencies [[`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3), [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @shared/feature-flags@0.13.0

## 0.6.0-next.0

### Minor Changes

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#18994](https://github.com/LedgerHQ/ledger-live/pull/18994) [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Ledger Wallet dust filtering feature flags and platform hook.

- [#19003](https://github.com/LedgerHQ/ledger-live/pull/19003) [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `quickActionCtas` sub-flag of `lwdWallet40` (always enabled) and inline the enabled behavior: QuickActions are now always shown in the Portfolio and the legacy send/receive/exchange sidebar entries are removed

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

### Patch Changes

- Updated dependencies [[`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3), [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a)]:
  - @shared/feature-flags@0.13.0-next.0

## 0.5.0

### Minor Changes

- [#18620](https://github.com/LedgerHQ/ledger-live/pull/18620) [`dd0be79`](https://github.com/LedgerHQ/ledger-live/commit/dd0be79ac4a388e9db17e349fbdf218f0a05a91f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add Q2 Tour on Portfolio with theme-aware slide images, Figma copy, persisted hasSeen state, and lwdWallet40 q2Tour flag

### Patch Changes

- Updated dependencies [[`dd0be79`](https://github.com/LedgerHQ/ledger-live/commit/dd0be79ac4a388e9db17e349fbdf218f0a05a91f), [`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e), [`98eb6d6`](https://github.com/LedgerHQ/ledger-live/commit/98eb6d636e8cbcf1ed35449f7070ac2a84b8b148), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`94923e3`](https://github.com/LedgerHQ/ledger-live/commit/94923e36342b58ebd4754ce41324680bd9eb1bfd), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @shared/feature-flags@0.12.0

## 0.5.0-next.2

### Patch Changes

- Updated dependencies [[`98eb6d6`](https://github.com/LedgerHQ/ledger-live/commit/98eb6d636e8cbcf1ed35449f7070ac2a84b8b148)]:
  - @shared/feature-flags@0.12.0-next.2

## 0.5.0-next.1

### Patch Changes

- Updated dependencies [[`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e)]:
  - @shared/feature-flags@0.12.0-next.1

## 0.5.0-next.0

### Minor Changes

- [#18620](https://github.com/LedgerHQ/ledger-live/pull/18620) [`dd0be79`](https://github.com/LedgerHQ/ledger-live/commit/dd0be79ac4a388e9db17e349fbdf218f0a05a91f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add Q2 Tour on Portfolio with theme-aware slide images, Figma copy, persisted hasSeen state, and lwdWallet40 q2Tour flag

### Patch Changes

- Updated dependencies [[`dd0be79`](https://github.com/LedgerHQ/ledger-live/commit/dd0be79ac4a388e9db17e349fbdf218f0a05a91f), [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573), [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23), [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934), [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108), [`94923e3`](https://github.com/LedgerHQ/ledger-live/commit/94923e36342b58ebd4754ce41324680bd9eb1bfd), [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8)]:
  - @shared/feature-flags@0.12.0-next.0

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

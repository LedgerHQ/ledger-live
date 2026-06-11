# @shared/feature-flags

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

# @shared/feature-flags

## 0.31.0-next.0

### Minor Changes

- [#24706](https://github.com/LedgerHQ/ledger-live/pull/24706) [`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Remove the `llmAccountListUI` feature flag: the accounts list is always on, and its legacy fallbacks are deleted.

- [#24725](https://github.com/LedgerHQ/ledger-live/pull/24725) [`1d97ca7`](https://github.com/LedgerHQ/ledger-live/commit/1d97ca78b8e326c5bdd1af98199dd9e9aa06b4c5) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the agentIntent flag and the Agent Intent entry points package: flag reading, analytics attributes and the Manage your agents card

- [#24687](https://github.com/LedgerHQ/ledger-live/pull/24687) [`d1e1f5f`](https://github.com/LedgerHQ/ledger-live/commit/d1e1f5f156ff95ae5fd7ebdeaec3b5d628d671b7) Thanks [@semeano](https://github.com/semeano)! - Register the alpen EVM currency behind the currencyAlpen feature flag, disabled by default

- [#24693](https://github.com/LedgerHQ/ledger-live/pull/24693) [`d593a3d`](https://github.com/LedgerHQ/ledger-live/commit/d593a3d4a21bcdc6e28a193521b949c1323a4a5b) Thanks [@rbobillot](https://github.com/rbobillot)! - Add the earnApiGravitee flag, off by default, so the earn live app can route its API calls through the prd Gravitee gateway

- [#24711](https://github.com/LedgerHQ/ledger-live/pull/24711) [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927) Thanks [@LL782](https://github.com/LL782)! - Remove the `llmMmkvMigration` flag, the storage rollback state and the storage performance overlay. The AsyncStorage to MMKV migration still runs from the Portfolio screen

- [#24593](https://github.com/LedgerHQ/ledger-live/pull/24593) [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a) Thanks [@deepyjr](https://github.com/deepyjr)! - Gate the Account Detail Analytics banner with the `accountDetail` `analyticsBanner` param, send it to analytics and keep the banner until it is closed

- [#24756](https://github.com/LedgerHQ/ledger-live/pull/24756) [`3a6ddb3`](https://github.com/LedgerHQ/ledger-live/commit/3a6ddb3fbd9d18c8005b9aef84597c8dc92dcfab) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): apply the die for the new send flow in lwd

## 0.30.0

### Minor Changes

- [#24412](https://github.com/LedgerHQ/ledger-live/pull/24412) [`39cb975`](https://github.com/LedgerHQ/ledger-live/commit/39cb9752fe05ea8510059b5302f1e44575641b78) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sample `estimateFees` and `validateIntent` successes in `coin_module_call` with a new `preparationSampleRate` param of the `coinObservability` flag (default 0.1): the bridge calls them on every edit of a transaction, so sending each call made them most of the volume. Their failures are still always sent, and `craftTransaction`, `craftRawTransaction`, `craftTransactionData`, `combine` and `broadcast` stay unsampled. Each `coin_module_call` now carries its tier's `sampleRate` and an `inSample` flag, so dashboards can compute unbiased failure rates and estimate volumes from the sample.

- [#24599](https://github.com/LedgerHQ/ledger-live/pull/24599) [`59280f5`](https://github.com/LedgerHQ/ledger-live/commit/59280f54cb1b4cf679f926dfeac4848103b0ac42) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the newReceiveFlow feature flag, off by default, with the families kept on the legacy receive flow

- [#24350](https://github.com/LedgerHQ/ledger-live/pull/24350) [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove the supportDeviceApex feature flag: Apex is always listed in onboarding device selection and BLE pairing

- [#24298](https://github.com/LedgerHQ/ledger-live/pull/24298) [`498cbdd`](https://github.com/LedgerHQ/ledger-live/commit/498cbdd918b0117959e9e0ff9db6adb31191b138) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show mobile transaction history and drop the lwmWallet40 operationsList param

- [#24527](https://github.com/LedgerHQ/ledger-live/pull/24527) [`62bdc34`](https://github.com/LedgerHQ/ledger-live/commit/62bdc344261d600a3d7d2b78a8cdb9e7b3c97c25) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the Ledger Sync add member and remove member Device Intents, which run the Ledger Sync SDK on the Device Intent Executor session, a `ledger_sync` source flow, and the `lwmLedgerSyncDie` and `lwdLedgerSyncDie` flags, off by default

- [#24406](https://github.com/LedgerHQ/ledger-live/pull/24406) [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show aggregated assets and drop the lwmWallet40 aggregatedAssets param

- [#24448](https://github.com/LedgerHQ/ledger-live/pull/24448) [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show asset discoverability and drop the lwmWallet40 assetDiscoverability param

- [#24347](https://github.com/LedgerHQ/ledger-live/pull/24347) [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show the mobile asset section and drop the lwmWallet40 assetSection param

- [#24202](https://github.com/LedgerHQ/ledger-live/pull/24202) [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show mobile My Wallet and drop the lwmWallet40 myWallet param

- [#24149](https://github.com/LedgerHQ/ledger-live/pull/24149) [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a Predictions card to the portfolio services entry points and a Predictions screen that opens the live app, behind the `ptxPredictionsLiveAppDesktop` and `ptxPredictionsLiveAppMobile` flags

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

- [#24568](https://github.com/LedgerHQ/ledger-live/pull/24568) [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98) Thanks [@qperrot](https://github.com/qperrot)! - Remove Stargaze from Ledger Wallet

- [#23599](https://github.com/LedgerHQ/ledger-live/pull/23599) [`0d2268d`](https://github.com/LedgerHQ/ledger-live/commit/0d2268d099e6ad7adac33bcb1e4456a28712a2ec) Thanks [@CremaFR](https://github.com/CremaFR)! - Run the custom.exchange device steps (nonce, Exchange app confirmation, signature) and their errors of wallet-api live apps in the Device Intent Executor drawer, behind the llmWalletApiDeviceIntentExchange flag, and send its A/B assignment to analytics and the swap live app. Keep the httpdebug compat device id of HTTP proxy devices instead of prefixing it with usb|

## 0.30.0-next.0

### Minor Changes

- [#24412](https://github.com/LedgerHQ/ledger-live/pull/24412) [`39cb975`](https://github.com/LedgerHQ/ledger-live/commit/39cb9752fe05ea8510059b5302f1e44575641b78) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sample `estimateFees` and `validateIntent` successes in `coin_module_call` with a new `preparationSampleRate` param of the `coinObservability` flag (default 0.1): the bridge calls them on every edit of a transaction, so sending each call made them most of the volume. Their failures are still always sent, and `craftTransaction`, `craftRawTransaction`, `craftTransactionData`, `combine` and `broadcast` stay unsampled. Each `coin_module_call` now carries its tier's `sampleRate` and an `inSample` flag, so dashboards can compute unbiased failure rates and estimate volumes from the sample.

- [#24599](https://github.com/LedgerHQ/ledger-live/pull/24599) [`59280f5`](https://github.com/LedgerHQ/ledger-live/commit/59280f54cb1b4cf679f926dfeac4848103b0ac42) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the newReceiveFlow feature flag, off by default, with the families kept on the legacy receive flow

- [#24350](https://github.com/LedgerHQ/ledger-live/pull/24350) [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove the supportDeviceApex feature flag: Apex is always listed in onboarding device selection and BLE pairing

- [#24298](https://github.com/LedgerHQ/ledger-live/pull/24298) [`498cbdd`](https://github.com/LedgerHQ/ledger-live/commit/498cbdd918b0117959e9e0ff9db6adb31191b138) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show mobile transaction history and drop the lwmWallet40 operationsList param

- [#24527](https://github.com/LedgerHQ/ledger-live/pull/24527) [`62bdc34`](https://github.com/LedgerHQ/ledger-live/commit/62bdc344261d600a3d7d2b78a8cdb9e7b3c97c25) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the Ledger Sync add member and remove member Device Intents, which run the Ledger Sync SDK on the Device Intent Executor session, a `ledger_sync` source flow, and the `lwmLedgerSyncDie` and `lwdLedgerSyncDie` flags, off by default

- [#24406](https://github.com/LedgerHQ/ledger-live/pull/24406) [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show aggregated assets and drop the lwmWallet40 aggregatedAssets param

- [#24448](https://github.com/LedgerHQ/ledger-live/pull/24448) [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show asset discoverability and drop the lwmWallet40 assetDiscoverability param

- [#24347](https://github.com/LedgerHQ/ledger-live/pull/24347) [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show the mobile asset section and drop the lwmWallet40 assetSection param

- [#24202](https://github.com/LedgerHQ/ledger-live/pull/24202) [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show mobile My Wallet and drop the lwmWallet40 myWallet param

- [#24149](https://github.com/LedgerHQ/ledger-live/pull/24149) [`1c210e4`](https://github.com/LedgerHQ/ledger-live/commit/1c210e4b18a75779af04c6a9448c5e3e2dd02b24) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a Predictions card to the portfolio services entry points and a Predictions screen that opens the live app, behind the `ptxPredictionsLiveAppDesktop` and `ptxPredictionsLiveAppMobile` flags

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

- [#24568](https://github.com/LedgerHQ/ledger-live/pull/24568) [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98) Thanks [@qperrot](https://github.com/qperrot)! - Remove Stargaze from Ledger Wallet

- [#23599](https://github.com/LedgerHQ/ledger-live/pull/23599) [`0d2268d`](https://github.com/LedgerHQ/ledger-live/commit/0d2268d099e6ad7adac33bcb1e4456a28712a2ec) Thanks [@CremaFR](https://github.com/CremaFR)! - Run the custom.exchange device steps (nonce, Exchange app confirmation, signature) and their errors of wallet-api live apps in the Device Intent Executor drawer, behind the llmWalletApiDeviceIntentExchange flag, and send its A/B assignment to analytics and the swap live app. Keep the httpdebug compat device id of HTTP proxy devices instead of prefixing it with usb|

## 0.29.0

### Minor Changes

- [#24024](https://github.com/LedgerHQ/ledger-live/pull/24024) [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137) Thanks [@qperrot](https://github.com/qperrot)! - Remove Blast and Blast Sepolia, whose chain shut down

- [#23972](https://github.com/LedgerHQ/ledger-live/pull/23972) [`7aeab58`](https://github.com/LedgerHQ/ledger-live/commit/7aeab582f0f6c8d38cf88af0c559dd37d77b9a1c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop aggregated assets, drop the lwdWallet40 param, and align desktop e2e

- [#24068](https://github.com/LedgerHQ/ledger-live/pull/24068) [`68196b4`](https://github.com/LedgerHQ/ledger-live/commit/68196b4642ad26ccce9b3263e45ee718572acb11) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show desktop asset discoverability without a feature flag

- [#24100](https://github.com/LedgerHQ/ledger-live/pull/24100) [`f95b426`](https://github.com/LedgerHQ/ledger-live/commit/f95b4268782b5cfd8cb4c14c9b0e5c6384cafa4d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show the desktop asset section and drop the lwdWallet40 assetSection param

- [#24046](https://github.com/LedgerHQ/ledger-live/pull/24046) [`e275739`](https://github.com/LedgerHQ/ledger-live/commit/e27573929d3e688afbb6544c58274e025867e6e4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add unifiedEntryPoints param to the deviceOnboarding feature flag, off by default. Mobile DevTools › Onboarding shows its switch automatically

- [#22966](https://github.com/LedgerHQ/ledger-live/pull/22966) [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf) Thanks [@qperrot](https://github.com/qperrot)! - Remove deprecated Moonbeam and Moonriver blockchains and the `currencyMoonriver` feature flag

## 0.29.0-next.0

### Minor Changes

- [#24024](https://github.com/LedgerHQ/ledger-live/pull/24024) [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137) Thanks [@qperrot](https://github.com/qperrot)! - Remove Blast and Blast Sepolia, whose chain shut down

- [#23972](https://github.com/LedgerHQ/ledger-live/pull/23972) [`7aeab58`](https://github.com/LedgerHQ/ledger-live/commit/7aeab582f0f6c8d38cf88af0c559dd37d77b9a1c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop aggregated assets, drop the lwdWallet40 param, and align desktop e2e

- [#24068](https://github.com/LedgerHQ/ledger-live/pull/24068) [`68196b4`](https://github.com/LedgerHQ/ledger-live/commit/68196b4642ad26ccce9b3263e45ee718572acb11) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show desktop asset discoverability without a feature flag

- [#24100](https://github.com/LedgerHQ/ledger-live/pull/24100) [`f95b426`](https://github.com/LedgerHQ/ledger-live/commit/f95b4268782b5cfd8cb4c14c9b0e5c6384cafa4d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show the desktop asset section and drop the lwdWallet40 assetSection param

- [#24046](https://github.com/LedgerHQ/ledger-live/pull/24046) [`e275739`](https://github.com/LedgerHQ/ledger-live/commit/e27573929d3e688afbb6544c58274e025867e6e4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add unifiedEntryPoints param to the deviceOnboarding feature flag, off by default. Mobile DevTools › Onboarding shows its switch automatically

- [#22966](https://github.com/LedgerHQ/ledger-live/pull/22966) [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf) Thanks [@qperrot](https://github.com/qperrot)! - Remove deprecated Moonbeam and Moonriver blockchains and the `currencyMoonriver` feature flag

## 0.28.0

### Minor Changes

- [#23628](https://github.com/LedgerHQ/ledger-live/pull/23628) [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feat(asset-detail): A/B test the swap console and a swap quick action on the LWD asset page

  `lwdSwapConsoleAbtest` params `console` and `quickAction` toggle the swap right panel and a highlighted Swap CTA placed before Receive. Flag state and params are reported to Mixpanel as `lwdSwapConsoleAbtest`.

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report coin-module calls and every broadcast outcome to Datadog logs behind the new `coinObservability` flag: `withMetrics` wraps the resolved coin-module API and reports each call to registered observers, sampled on the sync path and capped on failures, and the bridge seam's broadcast events are forwarded as `tx_broadcast` for every family and route.

- [#23816](https://github.com/LedgerHQ/ledger-live/pull/23816) [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feat(portfolio): A/B test services entry points cards between Crypto and Stablecoins

  `entryPointsServices` replaces the Perps and Borrow banners with a Services cards section on the LWD and LWM portfolio asset section. `params.services` sets which services show and their order. Flag state and order are reported to Mixpanel as `entryPointsServices`.

- [#23526](https://github.com/LedgerHQ/ledger-live/pull/23526) [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the desktop `operationsList` flag and always show transaction history

- [#23596](https://github.com/LedgerHQ/ledger-live/pull/23596) [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop My Wallet and drop the lwdWallet40 myWallet param

- [#23560](https://github.com/LedgerHQ/ledger-live/pull/23560) [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Remove the legacyTopUp param of lwmPayTab; mobile top-up always opens the Baanx hosted page.

- [#23588](https://github.com/LedgerHQ/ledger-live/pull/23588) [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show Wallet 4.0 PnL and drop the `pnl` feature flag param

- [#23638](https://github.com/LedgerHQ/ledger-live/pull/23638) [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c) Thanks [@dilaouid](https://github.com/dilaouid)! - Enforce manifest origins on the Live App bridges: the Wallet API and Platform API are served on a bridge session bound to the main-frame origin, desktop bridge messages go through main, mobile WebViews answer only the main frame on a manifest origin, manifest domains are enforced on every main-frame load (mobile check on by default), and violations are reported to Datadog

## 0.28.0-next.0

### Minor Changes

- [#23628](https://github.com/LedgerHQ/ledger-live/pull/23628) [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feat(asset-detail): A/B test the swap console and a swap quick action on the LWD asset page

  `lwdSwapConsoleAbtest` params `console` and `quickAction` toggle the swap right panel and a highlighted Swap CTA placed before Receive. Flag state and params are reported to Mixpanel as `lwdSwapConsoleAbtest`.

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report coin-module calls and every broadcast outcome to Datadog logs behind the new `coinObservability` flag: `withMetrics` wraps the resolved coin-module API and reports each call to registered observers, sampled on the sync path and capped on failures, and the bridge seam's broadcast events are forwarded as `tx_broadcast` for every family and route.

- [#23816](https://github.com/LedgerHQ/ledger-live/pull/23816) [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd) Thanks [@LucasWerey](https://github.com/LucasWerey)! - feat(portfolio): A/B test services entry points cards between Crypto and Stablecoins

  `entryPointsServices` replaces the Perps and Borrow banners with a Services cards section on the LWD and LWM portfolio asset section. `params.services` sets which services show and their order. Flag state and order are reported to Mixpanel as `entryPointsServices`.

- [#23526](https://github.com/LedgerHQ/ledger-live/pull/23526) [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the desktop `operationsList` flag and always show transaction history

- [#23596](https://github.com/LedgerHQ/ledger-live/pull/23596) [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop My Wallet and drop the lwdWallet40 myWallet param

- [#23560](https://github.com/LedgerHQ/ledger-live/pull/23560) [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Remove the legacyTopUp param of lwmPayTab; mobile top-up always opens the Baanx hosted page.

- [#23588](https://github.com/LedgerHQ/ledger-live/pull/23588) [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show Wallet 4.0 PnL and drop the `pnl` feature flag param

- [#23638](https://github.com/LedgerHQ/ledger-live/pull/23638) [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c) Thanks [@dilaouid](https://github.com/dilaouid)! - Enforce manifest origins on the Live App bridges: the Wallet API and Platform API are served on a bridge session bound to the main-frame origin, desktop bridge messages go through main, mobile WebViews answer only the main frame on a manifest origin, manifest domains are enforced on every main-frame load (mobile check on by default), and violations are reported to Datadog

## 0.27.0

### Minor Changes

- [#23341](https://github.com/LedgerHQ/ledger-live/pull/23341) [`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `accountDetail` feature flag (with `excludedCurrencyIds`) for the new Account Detail page and send its state to analytics.

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23442](https://github.com/LedgerHQ/ledger-live/pull/23442) [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d) Thanks [@semeano](https://github.com/semeano)! - Register the alpen_testnet EVM currency behind the currencyAlpenTestnet feature flag, disabled by default

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

- [#23240](https://github.com/LedgerHQ/ledger-live/pull/23240) [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - feat(onboarding): show the onboarding warning modal on touchscreen devices

- [#23472](https://github.com/LedgerHQ/ledger-live/pull/23472) [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083) Thanks [@sarneijim](https://github.com/sarneijim)! - Add connectUnseededDevice to deviceOnboarding and edit that mock from the mobile onboarding devtool

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

## 0.27.0-next.0

### Minor Changes

- [#23341](https://github.com/LedgerHQ/ledger-live/pull/23341) [`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `accountDetail` feature flag (with `excludedCurrencyIds`) for the new Account Detail page and send its state to analytics.

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23442](https://github.com/LedgerHQ/ledger-live/pull/23442) [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d) Thanks [@semeano](https://github.com/semeano)! - Register the alpen_testnet EVM currency behind the currencyAlpenTestnet feature flag, disabled by default

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

- [#23240](https://github.com/LedgerHQ/ledger-live/pull/23240) [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - feat(onboarding): show the onboarding warning modal on touchscreen devices

- [#23472](https://github.com/LedgerHQ/ledger-live/pull/23472) [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083) Thanks [@sarneijim](https://github.com/sarneijim)! - Add connectUnseededDevice to deviceOnboarding and edit that mock from the mobile onboarding devtool

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

## 0.26.0

### Minor Changes

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#23071](https://github.com/LedgerHQ/ledger-live/pull/23071) [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Offer Ledger Sync during device onboarding from the single `deviceOnboarding` feature flag

- [#22936](https://github.com/LedgerHQ/ledger-live/pull/22936) [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483) Thanks [@benruseau](https://github.com/benruseau)! - Add the `ldmkOsUpdates` feature flag, disabled by default.

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#23044](https://github.com/LedgerHQ/ledger-live/pull/23044) [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the lwmQuickActionsCtasVariant feature flag and its Receive/Send quick action CTAs variant

- [#23221](https://github.com/LedgerHQ/ledger-live/pull/23221) [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `connectSeededDevice` to the `deviceOnboarding` flag and send a non-seeded device to legacy onboarding unless the host can run seed setup

- [#22958](https://github.com/LedgerHQ/ledger-live/pull/22958) [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove leftovers of the dropped Sentry integration: the unused `llmSentry` feature flag and `DatadogId.exportDatadogIdForSentry`.

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

## 0.26.0-next.0

### Minor Changes

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#23071](https://github.com/LedgerHQ/ledger-live/pull/23071) [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Offer Ledger Sync during device onboarding from the single `deviceOnboarding` feature flag

- [#22936](https://github.com/LedgerHQ/ledger-live/pull/22936) [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483) Thanks [@benruseau](https://github.com/benruseau)! - Add the `ldmkOsUpdates` feature flag, disabled by default.

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#23044](https://github.com/LedgerHQ/ledger-live/pull/23044) [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the lwmQuickActionsCtasVariant feature flag and its Receive/Send quick action CTAs variant

- [#23221](https://github.com/LedgerHQ/ledger-live/pull/23221) [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `connectSeededDevice` to the `deviceOnboarding` flag and send a non-seeded device to legacy onboarding unless the host can run seed setup

- [#22958](https://github.com/LedgerHQ/ledger-live/pull/22958) [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove leftovers of the dropped Sentry integration: the unused `llmSentry` feature flag and `DatadogId.exportDatadogIdForSentry`.

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

## 0.25.0

### Minor Changes

- [#22612](https://github.com/LedgerHQ/ledger-live/pull/22612) [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Drop the Sui JSON-RPC transport, which the Sui Foundation retires, and make gRPC the default; GraphQL stays selectable through the `suiTransport` flag. coin-sui now owns the chain types it previously borrowed from `@mysten/sui/jsonRpc`.

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

- [#22534](https://github.com/LedgerHQ/ledger-live/pull/22534) [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): expose when the local cache read has settled

  The slice gains a transient `cachedFlagsSettled` flag, read with `selectCachedFlagsSettled`. The
  middleware arms it once the `readCachedFlags` prime settles, whether it primed, was empty or failed,
  and re-resolves first so an empty cache still gets env overrides and version filters applied. It
  never waits on the network, unlike `remoteFlagsReady`. Without a cache reader it is armed right away.

  A store configured with neither a cache reader nor a fetcher now arms `remoteFlagsReady` too, instead
  of leaving it `false` forever.

  A reducer or a downstream middleware that throws while the slice is re-resolved no longer aborts
  the boot sequence: the exception is reported to `onRemoteFlagsError` with the new `sync` stage, and
  `cachedFlagsSettled` and `remoteFlagsReady` are armed anyway, so a startup waiting on them is never
  stranded.

- [#22328](https://github.com/LedgerHQ/ledger-live/pull/22328) [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open top-up in the legacy `cl-card` live app when the new `legacyTopUp` param of `lwdPayTab` or `lwmPayTab` is on.

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22550](https://github.com/LedgerHQ/ledger-live/pull/22550) [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `ptxEarnCtaOnMobile` feature flag and send it to Mixpanel as a boolean identify trait. Earn reads it via Wallet API.

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

## 0.25.0-next.1

### Minor Changes

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

## 0.25.0-next.0

### Minor Changes

- [#22612](https://github.com/LedgerHQ/ledger-live/pull/22612) [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Drop the Sui JSON-RPC transport, which the Sui Foundation retires, and make gRPC the default; GraphQL stays selectable through the `suiTransport` flag. coin-sui now owns the chain types it previously borrowed from `@mysten/sui/jsonRpc`.

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

- [#22534](https://github.com/LedgerHQ/ledger-live/pull/22534) [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): expose when the local cache read has settled

  The slice gains a transient `cachedFlagsSettled` flag, read with `selectCachedFlagsSettled`. The
  middleware arms it once the `readCachedFlags` prime settles, whether it primed, was empty or failed,
  and re-resolves first so an empty cache still gets env overrides and version filters applied. It
  never waits on the network, unlike `remoteFlagsReady`. Without a cache reader it is armed right away.

  A store configured with neither a cache reader nor a fetcher now arms `remoteFlagsReady` too, instead
  of leaving it `false` forever.

  A reducer or a downstream middleware that throws while the slice is re-resolved no longer aborts
  the boot sequence: the exception is reported to `onRemoteFlagsError` with the new `sync` stage, and
  `cachedFlagsSettled` and `remoteFlagsReady` are armed anyway, so a startup waiting on them is never
  stranded.

- [#22328](https://github.com/LedgerHQ/ledger-live/pull/22328) [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open top-up in the legacy `cl-card` live app when the new `legacyTopUp` param of `lwdPayTab` or `lwmPayTab` is on.

- [#22550](https://github.com/LedgerHQ/ledger-live/pull/22550) [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `ptxEarnCtaOnMobile` feature flag and send it to Mixpanel as a boolean identify trait. Earn reads it via Wallet API.

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

## 0.24.0

### Minor Changes

- [#22038](https://github.com/LedgerHQ/ledger-live/pull/22038) [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): read the Baanx login and hosted manifest ids from the env, not from the `lwdPayTab` flag params

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

## 0.24.0-next.0

### Minor Changes

- [#22038](https://github.com/LedgerHQ/ledger-live/pull/22038) [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): read the Baanx login and hosted manifest ids from the env, not from the `lwdPayTab` flag params

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

## 0.23.0

### Minor Changes

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): let the middleware prime from a device-local flag cache

  `createFeatureFlagsMiddleware` accepts two new optional callbacks:

  - `readCachedFlags`, read before the first `fetchRemoteFlags` and without any network, so boot
    resolves on the last values the backend actually sent rather than on compiled defaults. The
    prime changes which values boot resolves on, not when readiness is announced: that stays
    with the first fetch settling, so the boot gates keep the meaning they already had. The one
    exception is a middleware given a cache reader and no fetcher, where nothing else would ever
    settle: there the prime re-resolves once and arms the gate itself.
  - `onRemoteFlagsError`, invoked once per failed read with its stage, attempt number and whether
    any values are held yet. Purely observational: the return value is ignored and a throwing
    handler cannot stop the poll loop. Failed fetches used to be swallowed silently.

  Both are opt-in. A middleware configured without `readCachedFlags` behaves exactly as before.

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): split the middleware body into named helpers

  `createFeatureFlagsMiddleware` now assembles a handful of small module-private helpers instead of
  inlining them, so its body reads as: build the collaborators, pick one of the two start-ups,
  return the middleware. `pollRemoteFlags` takes a deps object rather than seven positional
  arguments. Behaviour and public API are unchanged.

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

- [#21628](https://github.com/LedgerHQ/ledger-live/pull/21628) [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): add gasSponsorship feature flag

- [#21791](https://github.com/LedgerHQ/ledger-live/pull/21791) [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Complete the Card login on desktop. The provider's page opens in the Discover webview, and the
  manifest of the live app owns its origin. The `lwdPayTab` flag carries `baanx_login_manifest_id`
  and `baanx_hosted_manifest_id`, which default to the staging manifests. A redirect that echoes no
  attempt id now passes the callback guards, so the app's own deep link completes the login.

## 0.23.0-next.0

### Minor Changes

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): let the middleware prime from a device-local flag cache

  `createFeatureFlagsMiddleware` accepts two new optional callbacks:

  - `readCachedFlags`, read before the first `fetchRemoteFlags` and without any network, so boot
    resolves on the last values the backend actually sent rather than on compiled defaults. The
    prime changes which values boot resolves on, not when readiness is announced: that stays
    with the first fetch settling, so the boot gates keep the meaning they already had. The one
    exception is a middleware given a cache reader and no fetcher, where nothing else would ever
    settle: there the prime re-resolves once and arms the gate itself.
  - `onRemoteFlagsError`, invoked once per failed read with its stage, attempt number and whether
    any values are held yet. Purely observational: the return value is ignored and a throwing
    handler cannot stop the poll loop. Failed fetches used to be swallowed silently.

  Both are opt-in. A middleware configured without `readCachedFlags` behaves exactly as before.

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): split the middleware body into named helpers

  `createFeatureFlagsMiddleware` now assembles a handful of small module-private helpers instead of
  inlining them, so its body reads as: build the collaborators, pick one of the two start-ups,
  return the middleware. `pollRemoteFlags` takes a deps object rather than seven positional
  arguments. Behaviour and public API are unchanged.

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

- [#21628](https://github.com/LedgerHQ/ledger-live/pull/21628) [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): add gasSponsorship feature flag

- [#21791](https://github.com/LedgerHQ/ledger-live/pull/21791) [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Complete the Card login on desktop. The provider's page opens in the Discover webview, and the
  manifest of the live app owns its origin. The `lwdPayTab` flag carries `baanx_login_manifest_id`
  and `baanx_hosted_manifest_id`, which default to the staging manifests. A redirect that echoes no
  attempt id now passes the callback guards, so the app's own deep link completes the login.

## 0.22.0

### Minor Changes

- [#21833](https://github.com/LedgerHQ/ledger-live/pull/21833) [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix walletsync feature flags (lldWalletSync, llmWalletSync) to default to the PROD environment instead of STAGING.

- [#21396](https://github.com/LedgerHQ/ledger-live/pull/21396) [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add the Gonka (GNK) currency feature flag, disabled by default

- [#21283](https://github.com/LedgerHQ/ledger-live/pull/21283) [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add earn banner to success transation modal

## 0.22.0-next.1

### Minor Changes

- [#21833](https://github.com/LedgerHQ/ledger-live/pull/21833) [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix walletsync feature flags (lldWalletSync, llmWalletSync) to default to the PROD environment instead of STAGING.

## 0.22.0-next.0

### Minor Changes

- [#21396](https://github.com/LedgerHQ/ledger-live/pull/21396) [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add the Gonka (GNK) currency feature flag, disabled by default

- [#21283](https://github.com/LedgerHQ/ledger-live/pull/21283) [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add earn banner to success transation modal

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

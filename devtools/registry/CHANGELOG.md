# @devtools/registry

## 0.8.0

### Minor Changes

- [#24325](https://github.com/LedgerHQ/ledger-live/pull/24325) [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4) Thanks [@deepyjr](https://github.com/deepyjr)! - Add an account-detail DevTools tool to reset the Account Detail card that redirects to Analytics

- [#24415](https://github.com/LedgerHQ/ledger-live/pull/24415) [`4db45b9`](https://github.com/LedgerHQ/ledger-live/commit/4db45b933feabde39ce1bc98796e118eae10f47d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the coin-config DevTool on desktop and mobile to override LiveConfig values. The overrides slice moves to the new @shared/live-config-overrides package, and mobile now keeps the overrides across restarts

### Patch Changes

- Updated dependencies [[`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872), [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44), [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`d02425e`](https://github.com/LedgerHQ/ledger-live/commit/d02425e29efe55595b51556e598fde0f9c34574f), [`4db45b9`](https://github.com/LedgerHQ/ledger-live/commit/4db45b933feabde39ce1bc98796e118eae10f47d), [`e8ca231`](https://github.com/LedgerHQ/ledger-live/commit/e8ca231d007f43839987343437507ea02d0dad0d), [`43d4d30`](https://github.com/LedgerHQ/ledger-live/commit/43d4d308546a4013f2e230a42235015377eaa694)]:
  - @devtools/account-operation@0.3.0
  - @devtools/mock-accounts@0.3.0
  - @devtools/account-balance@0.3.0
  - @devtools/account-detail@0.2.0
  - @devtools/env@0.3.0
  - @devtools/cloud-sync@0.4.0
  - @devtools/trustchain@0.4.0
  - @devtools/feature-flags@0.12.0
  - @devtools/app-config@0.3.0
  - @devtools/device-onboarding@0.6.0
  - @devtools/pay-card@0.12.0
  - @devtools/coin-config@0.2.0

## 0.8.0-next.0

### Minor Changes

- [#24325](https://github.com/LedgerHQ/ledger-live/pull/24325) [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4) Thanks [@deepyjr](https://github.com/deepyjr)! - Add an account-detail DevTools tool to reset the Account Detail card that redirects to Analytics

- [#24415](https://github.com/LedgerHQ/ledger-live/pull/24415) [`4db45b9`](https://github.com/LedgerHQ/ledger-live/commit/4db45b933feabde39ce1bc98796e118eae10f47d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the coin-config DevTool on desktop and mobile to override LiveConfig values. The overrides slice moves to the new @shared/live-config-overrides package, and mobile now keeps the overrides across restarts

### Patch Changes

- Updated dependencies [[`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872), [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44), [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`d02425e`](https://github.com/LedgerHQ/ledger-live/commit/d02425e29efe55595b51556e598fde0f9c34574f), [`4db45b9`](https://github.com/LedgerHQ/ledger-live/commit/4db45b933feabde39ce1bc98796e118eae10f47d), [`e8ca231`](https://github.com/LedgerHQ/ledger-live/commit/e8ca231d007f43839987343437507ea02d0dad0d), [`43d4d30`](https://github.com/LedgerHQ/ledger-live/commit/43d4d308546a4013f2e230a42235015377eaa694)]:
  - @devtools/account-operation@0.3.0-next.0
  - @devtools/mock-accounts@0.3.0-next.0
  - @devtools/account-balance@0.3.0-next.0
  - @devtools/account-detail@0.2.0-next.0
  - @devtools/env@0.3.0-next.0
  - @devtools/cloud-sync@0.4.0-next.0
  - @devtools/trustchain@0.4.0-next.0
  - @devtools/feature-flags@0.12.0-next.0
  - @devtools/app-config@0.3.0-next.0
  - @devtools/device-onboarding@0.6.0-next.0
  - @devtools/pay-card@0.12.0-next.0
  - @devtools/coin-config@0.2.0-next.0

## 0.7.0

### Minor Changes

- [#24169](https://github.com/LedgerHQ/ledger-live/pull/24169) [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account balance histories slice, add a Balance history page to the DevTools Accounts section and serve the balanceHistory kind for mock accounts

- [#24071](https://github.com/LedgerHQ/ledger-live/pull/24071) [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account operations slice and add an Operations page to the DevTools Accounts section

- [#23985](https://github.com/LedgerHQ/ledger-live/pull/23985) [`97be95e`](https://github.com/LedgerHQ/ledger-live/commit/97be95ecba1a1989b8d5ccfc5c4bdf96cc60e767) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Name every devtool by its technical id, tag each with the kind of package it inspects (entity, api, feature, shared or lib), and give account-balance to Wallet XP

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

- [#23772](https://github.com/LedgerHQ/ledger-live/pull/23772) [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(devtools): add the account-portfolio devtool to call the Portfolio service, with a balance history chart and paged history

### Patch Changes

- Updated dependencies [[`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51), [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820), [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9)]:
  - @devtools/account-data@0.3.0
  - @devtools/account-operation@0.2.0
  - @devtools/account-balance-history@0.1.0
  - @devtools/mock-accounts@0.2.0
  - @devtools/account-descriptor@0.3.0
  - @devtools/account-portfolio@0.2.0
  - @devtools/feature-flags@0.11.1
  - @devtools/device-onboarding@0.5.1

## 0.7.0-next.0

### Minor Changes

- [#24169](https://github.com/LedgerHQ/ledger-live/pull/24169) [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account balance histories slice, add a Balance history page to the DevTools Accounts section and serve the balanceHistory kind for mock accounts

- [#24071](https://github.com/LedgerHQ/ledger-live/pull/24071) [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account operations slice and add an Operations page to the DevTools Accounts section

- [#23985](https://github.com/LedgerHQ/ledger-live/pull/23985) [`97be95e`](https://github.com/LedgerHQ/ledger-live/commit/97be95ecba1a1989b8d5ccfc5c4bdf96cc60e767) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Name every devtool by its technical id, tag each with the kind of package it inspects (entity, api, feature, shared or lib), and give account-balance to Wallet XP

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

- [#23772](https://github.com/LedgerHQ/ledger-live/pull/23772) [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(devtools): add the account-portfolio devtool to call the Portfolio service, with a balance history chart and paged history

### Patch Changes

- Updated dependencies [[`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51), [`566902e`](https://github.com/LedgerHQ/ledger-live/commit/566902e2101f69e0216ced4fe000daba775ff6bb), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820), [`5a6a32d`](https://github.com/LedgerHQ/ledger-live/commit/5a6a32df1c7d16cd6f3e4797002224f352cb2ba9)]:
  - @devtools/account-data@0.3.0-next.0
  - @devtools/account-operation@0.2.0-next.0
  - @devtools/account-balance-history@0.1.0-next.0
  - @devtools/mock-accounts@0.2.0-next.0
  - @devtools/account-descriptor@0.3.0-next.0
  - @devtools/account-portfolio@0.2.0-next.0
  - @devtools/feature-flags@0.11.1-next.0
  - @devtools/device-onboarding@0.5.1-next.0

## 0.6.0

### Minor Changes

- [#23614](https://github.com/LedgerHQ/ledger-live/pull/23614) [`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18) Thanks [@thesan](https://github.com/thesan)! - Add the App config devtool: it shows the default option of the build, then lists each app config switch with its options and their values, the option the session runs on and the one saved for the next. Selecting an option saves its id, and selecting the default removes it so the switch follows the default again; neither reloads. The Reload button (Restart on mobile) only appears while a saved option differs from the current one, and applies every saved change at once: a renderer reload on desktop, an app restart on mobile. A search bar and an All / Switched filter narrow the list. `resolveAppConfig` now returns `{ config, session }`: `session` is what it resolved the session from, which both stores pass to `createAppConfigMiddleware` with their reload. The middleware sets the new `appConfig` slice, saves the `selectAppConfigOption` and `resetAppConfigSwitch` actions to the storage and reloads on `reloadAppConfig`. `ConfigStorage` gains `remove`.

- [#23788](https://github.com/LedgerHQ/ledger-live/pull/23788) [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c) Thanks [@thesan](https://github.com/thesan)! - Add dev values to the app config on staging-default builds: each switch offers Dev | Staging | Prod and each fixed value Dev | Fixed in the App config devtool, which now also lists the fixed values. On Dev the values are text fields; a switch on Dev runs on its default option's values with its dev values on top, and a fixed value on its dev value. The schema of each value parses its dev value when the devtool saves it and again at boot, which ignores an invalid one. Dev values stay stored when another option is picked. Prod-default builds ignore Dev: they never offer it, never read the dev values, and ignore the selections holding `dev` without clearing them. The desktop build now defines `CONFIG_PROFILE` in every mode (`prod` outside development). `resolveAppConfig` now takes an `AppConfigStorage` (`selections` and `devValues`), `resetAppConfigSwitch` becomes `resetAppConfigSelection`, and `selectAppConfigOption` takes `{ id, selectionId }`. Playwright and Detox runs can pass dev values with `appConfigDevValues`.

- [#23589](https://github.com/LedgerHQ/ledger-live/pull/23589) [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add an Accounts section to DevTools with Account data, Descriptors and Balance pages

- [#23763](https://github.com/LedgerHQ/ledger-live/pull/23763) [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read an account name by AccountUUID, and add a Names page to the DevTools Accounts section

### Patch Changes

- Updated dependencies [[`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18), [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`e983155`](https://github.com/LedgerHQ/ledger-live/commit/e9831558eb3ee926d75cc14fbcad429fe8b656fc), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b)]:
  - @devtools/app-config@0.2.0
  - @devtools/account-data@0.2.0
  - @devtools/account-descriptor@0.2.0
  - @devtools/account-name@0.2.0
  - @devtools/cloud-sync@0.3.0
  - @devtools/device-onboarding@0.5.0
  - @devtools/feature-flags@0.11.0
  - @devtools/pay-card@0.11.0
  - @devtools/trustchain@0.3.0
  - @devtools/account-balance@0.2.0
  - @devtools/env@0.2.0

## 0.6.0-next.0

### Minor Changes

- [#23614](https://github.com/LedgerHQ/ledger-live/pull/23614) [`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18) Thanks [@thesan](https://github.com/thesan)! - Add the App config devtool: it shows the default option of the build, then lists each app config switch with its options and their values, the option the session runs on and the one saved for the next. Selecting an option saves its id, and selecting the default removes it so the switch follows the default again; neither reloads. The Reload button (Restart on mobile) only appears while a saved option differs from the current one, and applies every saved change at once: a renderer reload on desktop, an app restart on mobile. A search bar and an All / Switched filter narrow the list. `resolveAppConfig` now returns `{ config, session }`: `session` is what it resolved the session from, which both stores pass to `createAppConfigMiddleware` with their reload. The middleware sets the new `appConfig` slice, saves the `selectAppConfigOption` and `resetAppConfigSwitch` actions to the storage and reloads on `reloadAppConfig`. `ConfigStorage` gains `remove`.

- [#23788](https://github.com/LedgerHQ/ledger-live/pull/23788) [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c) Thanks [@thesan](https://github.com/thesan)! - Add dev values to the app config on staging-default builds: each switch offers Dev | Staging | Prod and each fixed value Dev | Fixed in the App config devtool, which now also lists the fixed values. On Dev the values are text fields; a switch on Dev runs on its default option's values with its dev values on top, and a fixed value on its dev value. The schema of each value parses its dev value when the devtool saves it and again at boot, which ignores an invalid one. Dev values stay stored when another option is picked. Prod-default builds ignore Dev: they never offer it, never read the dev values, and ignore the selections holding `dev` without clearing them. The desktop build now defines `CONFIG_PROFILE` in every mode (`prod` outside development). `resolveAppConfig` now takes an `AppConfigStorage` (`selections` and `devValues`), `resetAppConfigSwitch` becomes `resetAppConfigSelection`, and `selectAppConfigOption` takes `{ id, selectionId }`. Playwright and Detox runs can pass dev values with `appConfigDevValues`.

- [#23589](https://github.com/LedgerHQ/ledger-live/pull/23589) [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add an Accounts section to DevTools with Account data, Descriptors and Balance pages

- [#23763](https://github.com/LedgerHQ/ledger-live/pull/23763) [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read an account name by AccountUUID, and add a Names page to the DevTools Accounts section

### Patch Changes

- Updated dependencies [[`3bc8d98`](https://github.com/LedgerHQ/ledger-live/commit/3bc8d98b404d2f0c65cb7845025f316a5a8d2b18), [`2925816`](https://github.com/LedgerHQ/ledger-live/commit/29258167ffa59d7ad3337cdf2ed9ba5e37a1e86c), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`e983155`](https://github.com/LedgerHQ/ledger-live/commit/e9831558eb3ee926d75cc14fbcad429fe8b656fc), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b)]:
  - @devtools/app-config@0.2.0-next.0
  - @devtools/account-data@0.2.0-next.0
  - @devtools/account-descriptor@0.2.0-next.0
  - @devtools/account-name@0.2.0-next.0
  - @devtools/cloud-sync@0.3.0-next.0
  - @devtools/device-onboarding@0.5.0-next.0
  - @devtools/feature-flags@0.11.0-next.0
  - @devtools/pay-card@0.11.0-next.0
  - @devtools/trustchain@0.3.0-next.0
  - @devtools/account-balance@0.2.0-next.0
  - @devtools/env@0.2.0

## 0.5.3

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083)]:
  - @devtools/pay-card@0.10.0
  - @devtools/device-onboarding@0.4.0
  - @devtools/feature-flags@0.10.3
  - @devtools/cloud-sync@0.2.0
  - @devtools/env@0.2.0
  - @devtools/trustchain@0.2.0

## 0.5.3-next.0

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083)]:
  - @devtools/pay-card@0.10.0-next.0
  - @devtools/device-onboarding@0.4.0-next.0
  - @devtools/feature-flags@0.10.3-next.0
  - @devtools/cloud-sync@0.2.0
  - @devtools/env@0.2.0
  - @devtools/trustchain@0.2.0

## 0.5.2

### Patch Changes

- Updated dependencies [[`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b)]:
  - @devtools/pay-card@0.9.0
  - @devtools/device-onboarding@0.3.0
  - @devtools/feature-flags@0.10.2

## 0.5.2-next.0

### Patch Changes

- Updated dependencies [[`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b)]:
  - @devtools/pay-card@0.9.0-next.0
  - @devtools/device-onboarding@0.3.0-next.0
  - @devtools/feature-flags@0.10.2-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`c1f5830`](https://github.com/LedgerHQ/ledger-live/commit/c1f5830bc23997b2b965b2619d6a79935b3f5ba5), [`3b5a959`](https://github.com/LedgerHQ/ledger-live/commit/3b5a959ffd24bc06a91bb608924c0575d62eb753), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c)]:
  - @devtools/pay-card@0.8.0
  - @devtools/device-onboarding@0.2.1
  - @devtools/feature-flags@0.10.1

## 0.5.1-next.1

### Patch Changes

- Updated dependencies [[`3b5a959`](https://github.com/LedgerHQ/ledger-live/commit/3b5a959ffd24bc06a91bb608924c0575d62eb753), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21)]:
  - @devtools/pay-card@0.8.0-next.1
  - @devtools/feature-flags@0.10.1-next.1

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`c1f5830`](https://github.com/LedgerHQ/ledger-live/commit/c1f5830bc23997b2b965b2619d6a79935b3f5ba5), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c)]:
  - @devtools/pay-card@0.8.0-next.0
  - @devtools/device-onboarding@0.2.1-next.0
  - @devtools/feature-flags@0.10.1-next.0

## 0.5.0

### Minor Changes

- [#22145](https://github.com/LedgerHQ/ledger-live/pull/22145) [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847) Thanks [@ysitbon](https://github.com/ysitbon)! - Put every devtools package under knip and remove the dead code it found

  Dual-platform packages run knip once per platform through `createDualPlatformKnipConfig`, so a
  suffix-less `./Tool` specifier resolves to the right twin instead of orphaning both. Removed: the
  unreachable `Expand` component, the `metadata` and web-only `hooks` barrels, and the named exports
  that duplicated a default export. `@devtools/protocols` now enumerates its two subpath exports
  instead of a `./*` wildcard.

- [#22309](https://github.com/LedgerHQ/ledger-live/pull/22309) [`01473d6`](https://github.com/LedgerHQ/ledger-live/commit/01473d6dff53295312cef15863aff5abbf6ccf09) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the Device Onboarding devtool, which runs the shared onboarding flow against a real device

### Patch Changes

- Updated dependencies [[`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847), [`01473d6`](https://github.com/LedgerHQ/ledger-live/commit/01473d6dff53295312cef15863aff5abbf6ccf09), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a)]:
  - @devtools/pay-card@0.7.0
  - @devtools/cloud-sync@0.2.0
  - @devtools/feature-flags@0.10.0
  - @devtools/env@0.2.0
  - @devtools/trustchain@0.2.0
  - @devtools/device-onboarding@0.2.0

## 0.5.0-next.0

### Minor Changes

- [#22145](https://github.com/LedgerHQ/ledger-live/pull/22145) [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847) Thanks [@ysitbon](https://github.com/ysitbon)! - Put every devtools package under knip and remove the dead code it found

  Dual-platform packages run knip once per platform through `createDualPlatformKnipConfig`, so a
  suffix-less `./Tool` specifier resolves to the right twin instead of orphaning both. Removed: the
  unreachable `Expand` component, the `metadata` and web-only `hooks` barrels, and the named exports
  that duplicated a default export. `@devtools/protocols` now enumerates its two subpath exports
  instead of a `./*` wildcard.

- [#22309](https://github.com/LedgerHQ/ledger-live/pull/22309) [`01473d6`](https://github.com/LedgerHQ/ledger-live/commit/01473d6dff53295312cef15863aff5abbf6ccf09) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the Device Onboarding devtool, which runs the shared onboarding flow against a real device

### Patch Changes

- Updated dependencies [[`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847), [`01473d6`](https://github.com/LedgerHQ/ledger-live/commit/01473d6dff53295312cef15863aff5abbf6ccf09), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a)]:
  - @devtools/pay-card@0.7.0-next.0
  - @devtools/cloud-sync@0.2.0-next.0
  - @devtools/feature-flags@0.10.0-next.0
  - @devtools/env@0.2.0-next.0
  - @devtools/trustchain@0.2.0-next.0
  - @devtools/device-onboarding@0.2.0-next.0

## 0.4.3

### Patch Changes

- Updated dependencies [[`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`41f7dc9`](https://github.com/LedgerHQ/ledger-live/commit/41f7dc963ac7329e5ec07236c85e322a56476be7), [`fbfdc3f`](https://github.com/LedgerHQ/ledger-live/commit/fbfdc3f5767a4dfbbf79de16fe9bcc61f9b5b941), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f)]:
  - @devtools/pay-card@0.6.0
  - @devtools/feature-flags@0.9.2

## 0.4.3-next.0

### Patch Changes

- Updated dependencies [[`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`41f7dc9`](https://github.com/LedgerHQ/ledger-live/commit/41f7dc963ac7329e5ec07236c85e322a56476be7), [`fbfdc3f`](https://github.com/LedgerHQ/ledger-live/commit/fbfdc3f5767a4dfbbf79de16fe9bcc61f9b5b941), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f)]:
  - @devtools/pay-card@0.6.0-next.0
  - @devtools/feature-flags@0.9.2-next.0

## 0.4.2

### Patch Changes

- Updated dependencies [[`81aa729`](https://github.com/LedgerHQ/ledger-live/commit/81aa7294c94ef114e6e82ec4c277f0a6c0038c92), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`ef29f07`](https://github.com/LedgerHQ/ledger-live/commit/ef29f0711ecec104e4dd9c9d86d4e4d41c4ddee3), [`d6b290b`](https://github.com/LedgerHQ/ledger-live/commit/d6b290b37b8ad6f677ab382bef53bf05cd394ca2), [`0a02a32`](https://github.com/LedgerHQ/ledger-live/commit/0a02a325f99033c086864b0778a8f81c3b4178ae), [`66c7569`](https://github.com/LedgerHQ/ledger-live/commit/66c7569dcfae90739b369ffb3a92cee75dd2e9cd), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`760dab2`](https://github.com/LedgerHQ/ledger-live/commit/760dab246a27d62f0feaa349122164e1c48aa6e4)]:
  - @devtools/pay-card@0.5.0
  - @devtools/feature-flags@0.9.1

## 0.4.2-next.1

### Patch Changes

- Updated dependencies []:
  - @devtools/feature-flags@0.9.1-next.1

## 0.4.2-next.0

### Patch Changes

- Updated dependencies [[`81aa729`](https://github.com/LedgerHQ/ledger-live/commit/81aa7294c94ef114e6e82ec4c277f0a6c0038c92), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`ef29f07`](https://github.com/LedgerHQ/ledger-live/commit/ef29f0711ecec104e4dd9c9d86d4e4d41c4ddee3), [`d6b290b`](https://github.com/LedgerHQ/ledger-live/commit/d6b290b37b8ad6f677ab382bef53bf05cd394ca2), [`0a02a32`](https://github.com/LedgerHQ/ledger-live/commit/0a02a325f99033c086864b0778a8f81c3b4178ae), [`66c7569`](https://github.com/LedgerHQ/ledger-live/commit/66c7569dcfae90739b369ffb3a92cee75dd2e9cd), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`760dab2`](https://github.com/LedgerHQ/ledger-live/commit/760dab246a27d62f0feaa349122164e1c48aa6e4)]:
  - @devtools/pay-card@0.5.0-next.0
  - @devtools/feature-flags@0.9.1-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

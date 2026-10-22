# @shared/feature-flags

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

## 0.21.0

### Minor Changes

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

- [#21188](https://github.com/LedgerHQ/ledger-live/pull/21188) [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): ask ledger sync on add contact

- [#21152](https://github.com/LedgerHQ/ledger-live/pull/21152) [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `stableSavings` feature flag, forward it to Earn on initial load, and send it to Mixpanel as a boolean identify trait on desktop and mobile.

## 0.21.0-next.0

### Minor Changes

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

- [#21188](https://github.com/LedgerHQ/ledger-live/pull/21188) [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): ask ledger sync on add contact

- [#21152](https://github.com/LedgerHQ/ledger-live/pull/21152) [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `stableSavings` feature flag, forward it to Earn on initial load, and send it to Mixpanel as a boolean identify trait on desktop and mobile.

## 0.20.0

### Minor Changes

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20834](https://github.com/LedgerHQ/ledger-live/pull/20834) [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a My Wallet Profile LNS upsell banner gated by `largeScreenUpsell.banners.profile` (LIVE-35481). Require `utmContent` on `buildLargeScreenUpsellCtaLink` and export `LARGE_SCREEN_UPSELL_UTM`.

- [#20925](https://github.com/LedgerHQ/ledger-live/pull/20925) [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Gate Recover Nano S intercept and Backup Hub Recovery Key warning with `largeScreenUpsell.params.banners["recover-page-block-nano-s-only"]` and `banners["backup-hub-recovery-key-text-warning"]`.

- [#20996](https://github.com/LedgerHQ/ledger-live/pull/20996) [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d) Thanks [@CremaFR](https://github.com/CremaFR)! - Forward the `llmWalletApiDeviceIntentSign` assignment to the swap live app on mobile as `llmWalletApiDeviceIntentSignVariant` (the `variantId`) and `llmWalletApiDeviceIntentSignEnabled` (the flag state). Resolve that per manifest through `useDeviceIntentSignAssignment`, which also backs the Wallet API UI hook. Report both attributes on Mixpanel via `getRemoteABTestingAttributes`.

- [#20650](https://github.com/LedgerHQ/ledger-live/pull/20650) [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a gRPC-web transport to the Sui coin module

  - `coin-sui` gains a third transport on `sui.rpc.v2` over gRPC-web, covering every capability from
    checkpoints to device signing.
  - New tri-state `suiTransport` feature flag (`json` | `grpc` | `graphql`), defaulting to `json`,
    replaces the boolean `suiGraphqlTransport`, which is removed. An unrecognised value resolves to
    `json`.
  - New env vars `API_SUI_GRPC_PROXY` and `API_SUI_TESTNET_GRPC_PROXY`. `@mysten/sui` 2.9.0 → 2.23.1.
  - Operation `blockHash` carries the real checkpoint digest on gRPC.
  - Fix: account sync read a single page of history on GraphQL and gRPC, capping an account at its
    newest 50 operations for good — sync resumes from the newest stored operation and never re-reads
    what it skipped. Both arms now walk up to `TRANSACTIONS_LIMIT` (300), the depth JSON-RPC reached.
  - Fix: a resumed sync on GraphQL and gRPC read backwards from the tip, so when more than
    `TRANSACTIONS_LIMIT` transactions arrived between two syncs, the ones in the middle were skipped
    and the next sync resumed above them — a permanent hole. Both arms now walk forward from the
    cursor, as the JSON-RPC arm already did, leaving anything unread newer than the next resume point.
  - Fix: an account holding no operations resumed from its stored `syncHash`, so a cleared cache came
    back with only the transactions that arrived after it. Such an account now re-reads its history,
    which is also how one truncated by the bug above recovers. Token operations count as history: they
    live in the subaccounts, so a token-only account is no longer treated as empty.
  - Fix: on gRPC, any failure to resolve a cursor's digest — including a transient network error — was
    read as "unknown digest", which falls back to an unbounded page from the tip and made paging report
    the end of history. Only a `NOT_FOUND` does that now; everything else propagates and is retried.
  - Fix: reading history skipped transactions that shared a checkpoint with the resume point, in
    account sync (`getOperations`) as well as paging (`getListOperations`).
  - Fix: paging inferred "more to come" from how many operations survived client-side filtering, which
    ended the walk early. GraphQL now reads `pageInfo`, gRPC the stream's `QueryEnd` reason. A page
    whose transactions were all filtered out now resumes from the page's own boundary instead of
    reporting the end of history.
  - Fix: a gRPC history record with no timestamp became an operation dated 1970 that could not serve as
    a pagination cursor. Those records are now dropped, as the GraphQL arm already did.
  - Fix: ascending paging on GraphQL returned the newest slice of the range instead of walking forward
    from the oldest.
  - Fix: the Sui fetcher dropped `X-Ledger-Client-Version` and all gRPC-web headers when passed a
    `Headers` instance.
  - Fix: GraphQL resolved the latest checkpoint in two queries, so the second could answer null. It is
    now one query.
  - A checkpoint missing its `digest` or `timestamp` now raises on both GraphQL and gRPC, instead of
    reporting a block with an empty hash and a 1970 timestamp.
  - Known limitation: `getListOperations` resumes from a synthesised `timestamp:digest` cursor, so
    within one checkpoint a sibling whose digest sorts earlier can be skipped, and a checkpoint holding
    more than one page is stepped over rather than resumed inside. Account sync is unaffected: it
    resumes from the server's own watermark cursor.

## 0.20.0-next.0

### Minor Changes

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20834](https://github.com/LedgerHQ/ledger-live/pull/20834) [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a My Wallet Profile LNS upsell banner gated by `largeScreenUpsell.banners.profile` (LIVE-35481). Require `utmContent` on `buildLargeScreenUpsellCtaLink` and export `LARGE_SCREEN_UPSELL_UTM`.

- [#20925](https://github.com/LedgerHQ/ledger-live/pull/20925) [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Gate Recover Nano S intercept and Backup Hub Recovery Key warning with `largeScreenUpsell.params.banners["recover-page-block-nano-s-only"]` and `banners["backup-hub-recovery-key-text-warning"]`.

- [#20996](https://github.com/LedgerHQ/ledger-live/pull/20996) [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d) Thanks [@CremaFR](https://github.com/CremaFR)! - Forward the `llmWalletApiDeviceIntentSign` assignment to the swap live app on mobile as `llmWalletApiDeviceIntentSignVariant` (the `variantId`) and `llmWalletApiDeviceIntentSignEnabled` (the flag state). Resolve that per manifest through `useDeviceIntentSignAssignment`, which also backs the Wallet API UI hook. Report both attributes on Mixpanel via `getRemoteABTestingAttributes`.

- [#20650](https://github.com/LedgerHQ/ledger-live/pull/20650) [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a gRPC-web transport to the Sui coin module

  - `coin-sui` gains a third transport on `sui.rpc.v2` over gRPC-web, covering every capability from
    checkpoints to device signing.
  - New tri-state `suiTransport` feature flag (`json` | `grpc` | `graphql`), defaulting to `json`,
    replaces the boolean `suiGraphqlTransport`, which is removed. An unrecognised value resolves to
    `json`.
  - New env vars `API_SUI_GRPC_PROXY` and `API_SUI_TESTNET_GRPC_PROXY`. `@mysten/sui` 2.9.0 → 2.23.1.
  - Operation `blockHash` carries the real checkpoint digest on gRPC.
  - Fix: account sync read a single page of history on GraphQL and gRPC, capping an account at its
    newest 50 operations for good — sync resumes from the newest stored operation and never re-reads
    what it skipped. Both arms now walk up to `TRANSACTIONS_LIMIT` (300), the depth JSON-RPC reached.
  - Fix: a resumed sync on GraphQL and gRPC read backwards from the tip, so when more than
    `TRANSACTIONS_LIMIT` transactions arrived between two syncs, the ones in the middle were skipped
    and the next sync resumed above them — a permanent hole. Both arms now walk forward from the
    cursor, as the JSON-RPC arm already did, leaving anything unread newer than the next resume point.
  - Fix: an account holding no operations resumed from its stored `syncHash`, so a cleared cache came
    back with only the transactions that arrived after it. Such an account now re-reads its history,
    which is also how one truncated by the bug above recovers. Token operations count as history: they
    live in the subaccounts, so a token-only account is no longer treated as empty.
  - Fix: on gRPC, any failure to resolve a cursor's digest — including a transient network error — was
    read as "unknown digest", which falls back to an unbounded page from the tip and made paging report
    the end of history. Only a `NOT_FOUND` does that now; everything else propagates and is retried.
  - Fix: reading history skipped transactions that shared a checkpoint with the resume point, in
    account sync (`getOperations`) as well as paging (`getListOperations`).
  - Fix: paging inferred "more to come" from how many operations survived client-side filtering, which
    ended the walk early. GraphQL now reads `pageInfo`, gRPC the stream's `QueryEnd` reason. A page
    whose transactions were all filtered out now resumes from the page's own boundary instead of
    reporting the end of history.
  - Fix: a gRPC history record with no timestamp became an operation dated 1970 that could not serve as
    a pagination cursor. Those records are now dropped, as the GraphQL arm already did.
  - Fix: ascending paging on GraphQL returned the newest slice of the range instead of walking forward
    from the oldest.
  - Fix: the Sui fetcher dropped `X-Ledger-Client-Version` and all gRPC-web headers when passed a
    `Headers` instance.
  - Fix: GraphQL resolved the latest checkpoint in two queries, so the second could answer null. It is
    now one query.
  - A checkpoint missing its `digest` or `timestamp` now raises on both GraphQL and gRPC, instead of
    reporting a block with an empty hash and a 1970 timestamp.
  - Known limitation: `getListOperations` resumes from a synthesised `timestamp:digest` cursor, so
    within one checkpoint a sibling whose digest sorts earlier can be skipped, and a checkpoint holding
    more than one page is stepped over rather than resumed inside. Account sync is unaffected: it
    resumes from the server's own watermark cursor.

## 0.19.0

### Minor Changes

- [#20848](https://github.com/LedgerHQ/ledger-live/pull/20848) [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `lwmPasswordRevamp` feature flag, gating the User App Authentication epic on Ledger Wallet Mobile. Boolean gate with no params, disabled by default; its Remote Config key is derived as `feature_lwm_password_revamp`. Nothing reads it yet.

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20630](https://github.com/LedgerHQ/ledger-live/pull/20630) [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c) Thanks [@sarneijim](https://github.com/sarneijim)! - Enable LNS upsell portfolio banner for opted-in users (LIVE-32086).

## 0.19.0-next.1

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

## 0.19.0-next.0

### Minor Changes

- [#20848](https://github.com/LedgerHQ/ledger-live/pull/20848) [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `lwmPasswordRevamp` feature flag, gating the User App Authentication epic on Ledger Wallet Mobile. Boolean gate with no params, disabled by default; its Remote Config key is derived as `feature_lwm_password_revamp`. Nothing reads it yet.

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20630](https://github.com/LedgerHQ/ledger-live/pull/20630) [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c) Thanks [@sarneijim](https://github.com/sarneijim)! - Enable LNS upsell portfolio banner for opted-in users (LIVE-32086).

## 0.18.0

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

- [#20290](https://github.com/LedgerHQ/ledger-live/pull/20290) [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the shared lazy onboarding banner flow, its Mobile portfolio view and configurable Shop link feature flag.

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

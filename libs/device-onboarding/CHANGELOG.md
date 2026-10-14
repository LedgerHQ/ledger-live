# @ledgerhq/device-onboarding

## 0.5.0

### Minor Changes

- [#22598](https://github.com/LedgerHQ/ledger-live/pull/22598) [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Handle firmware handover and onboarding exits, and drive every Nano S through the shared flow

- [#23078](https://github.com/LedgerHQ/ledger-live/pull/23078) [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - List apps through the secure channel during the firmware check

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#23221](https://github.com/LedgerHQ/ledger-live/pull/23221) [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `connectSeededDevice` to the `deviceOnboarding` flag and send a non-seeded device to legacy onboarding unless the host can run seed setup

- [#22859](https://github.com/LedgerHQ/ledger-live/pull/22859) [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877) Thanks [@sarneijim](https://github.com/sarneijim)! - Share the DevTools host mapping and the session event actor so desktop and mobile stop copying them.

- [#23149](https://github.com/LedgerHQ/ledger-live/pull/23149) [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Build the device onboarding test kit in one place and export it from `./testing`

- [#22979](https://github.com/LedgerHQ/ledger-live/pull/22979) [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep the Ledger Recovery Key backup as its own onboarding step

## 0.5.0-next.0

### Minor Changes

- [#22598](https://github.com/LedgerHQ/ledger-live/pull/22598) [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Handle firmware handover and onboarding exits, and drive every Nano S through the shared flow

- [#23078](https://github.com/LedgerHQ/ledger-live/pull/23078) [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - List apps through the secure channel during the firmware check

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#23221](https://github.com/LedgerHQ/ledger-live/pull/23221) [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `connectSeededDevice` to the `deviceOnboarding` flag and send a non-seeded device to legacy onboarding unless the host can run seed setup

- [#22859](https://github.com/LedgerHQ/ledger-live/pull/22859) [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877) Thanks [@sarneijim](https://github.com/sarneijim)! - Share the DevTools host mapping and the session event actor so desktop and mobile stop copying them.

- [#23149](https://github.com/LedgerHQ/ledger-live/pull/23149) [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Build the device onboarding test kit in one place and export it from `./testing`

- [#22979](https://github.com/LedgerHQ/ledger-live/pull/22979) [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep the Ledger Recovery Key backup as its own onboarding step

## 0.4.0

### Minor Changes

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22452](https://github.com/LedgerHQ/ledger-live/pull/22452) [`eddfcd4`](https://github.com/LedgerHQ/ledger-live/commit/eddfcd47ba49d55715ed9dc7a619867cd5a636d5) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Bump @ledgerhq/device-management-kit to 1.9.1

## 0.4.0-next.0

### Minor Changes

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22452](https://github.com/LedgerHQ/ledger-live/pull/22452) [`eddfcd4`](https://github.com/LedgerHQ/ledger-live/commit/eddfcd47ba49d55715ed9dc7a619867cd5a636d5) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Bump @ledgerhq/device-management-kit to 1.9.1

## 0.3.0

### Minor Changes

- [#22156](https://github.com/LedgerHQ/ledger-live/pull/22156) [`07546c2`](https://github.com/LedgerHQ/ledger-live/commit/07546c22eabba5a381dc1c436410264333af5696) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Follow on-device setup through seed creation and restore, and exit on `completed` or `offerLedgerSync`.

- [#22080](https://github.com/LedgerHQ/ledger-live/pull/22080) [`5c5656a`](https://github.com/LedgerHQ/ledger-live/commit/5c5656a533350c7b37d3000e0276bc6bae8263af) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add `deviceOnboardingMachine`: routing, the genuine and firmware checks, and the global lock, transport and quit handlers.

## 0.3.0-next.0

### Minor Changes

- [#22156](https://github.com/LedgerHQ/ledger-live/pull/22156) [`07546c2`](https://github.com/LedgerHQ/ledger-live/commit/07546c22eabba5a381dc1c436410264333af5696) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Follow on-device setup through seed creation and restore, and exit on `completed` or `offerLedgerSync`.

- [#22080](https://github.com/LedgerHQ/ledger-live/pull/22080) [`5c5656a`](https://github.com/LedgerHQ/ledger-live/commit/5c5656a533350c7b37d3000e0276bc6bae8263af) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add `deviceOnboardingMachine`: routing, the genuine and firmware checks, and the global lock, transport and quit handlers.

## 0.2.0

### Minor Changes

- [#21890](https://github.com/LedgerHQ/ledger-live/pull/21890) [`f9aac2a`](https://github.com/LedgerHQ/ledger-live/commit/f9aac2a85f7f711f09fdc682ee18df8316096371) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the device state, genuine check, firmware check, early check toggle and seed polling actors

- [#21677](https://github.com/LedgerHQ/ledger-live/pull/21677) [`f4aaf52`](https://github.com/LedgerHQ/ledger-live/commit/f4aaf524892c448037835957adeb36b775e03213) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Scaffold the shared device onboarding package with ports, events and a session listener

## 0.2.0-next.0

### Minor Changes

- [#21890](https://github.com/LedgerHQ/ledger-live/pull/21890) [`f9aac2a`](https://github.com/LedgerHQ/ledger-live/commit/f9aac2a85f7f711f09fdc682ee18df8316096371) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the device state, genuine check, firmware check, early check toggle and seed polling actors

- [#21677](https://github.com/LedgerHQ/ledger-live/pull/21677) [`f4aaf52`](https://github.com/LedgerHQ/ledger-live/commit/f4aaf524892c448037835957adeb36b775e03213) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Scaffold the shared device onboarding package with ports, events and a session listener

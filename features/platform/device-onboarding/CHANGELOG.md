# @features/platform-device-onboarding

## 0.5.0

### Minor Changes

- [#24346](https://github.com/LedgerHQ/ledger-live/pull/24346) [`72da4b1`](https://github.com/LedgerHQ/ledger-live/commit/72da4b19bd803dc85ef83d3b09a45445f95186fa) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Confirm before leaving an unseeded device setup, and keep onboarding incomplete until the end

- [#24303](https://github.com/LedgerHQ/ledger-live/pull/24303) [`e8ca231`](https://github.com/LedgerHQ/ledger-live/commit/e8ca231d007f43839987343437507ea02d0dad0d) Thanks [@ysitbon](https://github.com/ysitbon)! - Split device onboarding by job: `@features/platform-device-onboarding` runs the actor with `useDeviceOnboardingActor`, and `@devtools/bindings` builds the devtool's log, context and next states with `useDeviceOnboardingToolState` and `useDeviceOnboardingToolProps`. The mobile funnel no longer imports `@devtools/*`, and the desktop device onboarding code moves under DevTools

- [#24273](https://github.com/LedgerHQ/ledger-live/pull/24273) [`8dae360`](https://github.com/LedgerHQ/ledger-live/commit/8dae360c044392da40c67e29416d11bbe34afd8b) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Keep polling the device through seed entry before treating the transport as lost

- [#24441](https://github.com/LedgerHQ/ledger-live/pull/24441) [`e0ac369`](https://github.com/LedgerHQ/ledger-live/commit/e0ac36999d2ff30c0788c40a4a7ed80293d72fe0) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Show the unlock sheet when a device locks during onboarding checks

- [#24282](https://github.com/LedgerHQ/ledger-live/pull/24282) [`80b6233`](https://github.com/LedgerHQ/ledger-live/commit/80b62337e7e2b754004ca5f93b9f7d569015e1eb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remember which seed path an unseeded device took

- [#24199](https://github.com/LedgerHQ/ledger-live/pull/24199) [`f53d517`](https://github.com/LedgerHQ/ledger-live/commit/f53d517815a694c54cb535ba39ebc1b249a88775) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Open the unseeded device funnel from Set up your Ledger, and skip Ledger Sync after setup

## 0.5.0-next.0

### Minor Changes

- [#24346](https://github.com/LedgerHQ/ledger-live/pull/24346) [`72da4b1`](https://github.com/LedgerHQ/ledger-live/commit/72da4b19bd803dc85ef83d3b09a45445f95186fa) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Confirm before leaving an unseeded device setup, and keep onboarding incomplete until the end

- [#24303](https://github.com/LedgerHQ/ledger-live/pull/24303) [`e8ca231`](https://github.com/LedgerHQ/ledger-live/commit/e8ca231d007f43839987343437507ea02d0dad0d) Thanks [@ysitbon](https://github.com/ysitbon)! - Split device onboarding by job: `@features/platform-device-onboarding` runs the actor with `useDeviceOnboardingActor`, and `@devtools/bindings` builds the devtool's log, context and next states with `useDeviceOnboardingToolState` and `useDeviceOnboardingToolProps`. The mobile funnel no longer imports `@devtools/*`, and the desktop device onboarding code moves under DevTools

- [#24273](https://github.com/LedgerHQ/ledger-live/pull/24273) [`8dae360`](https://github.com/LedgerHQ/ledger-live/commit/8dae360c044392da40c67e29416d11bbe34afd8b) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Keep polling the device through seed entry before treating the transport as lost

- [#24441](https://github.com/LedgerHQ/ledger-live/pull/24441) [`e0ac369`](https://github.com/LedgerHQ/ledger-live/commit/e0ac36999d2ff30c0788c40a4a7ed80293d72fe0) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Show the unlock sheet when a device locks during onboarding checks

- [#24282](https://github.com/LedgerHQ/ledger-live/pull/24282) [`80b6233`](https://github.com/LedgerHQ/ledger-live/commit/80b62337e7e2b754004ca5f93b9f7d569015e1eb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remember which seed path an unseeded device took

- [#24199](https://github.com/LedgerHQ/ledger-live/pull/24199) [`f53d517`](https://github.com/LedgerHQ/ledger-live/commit/f53d517815a694c54cb535ba39ebc1b249a88775) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Open the unseeded device funnel from Set up your Ledger, and skip Ledger Sync after setup

## 0.4.0

### Minor Changes

- [#24069](https://github.com/LedgerHQ/ledger-live/pull/24069) [`33fc619`](https://github.com/LedgerHQ/ledger-live/commit/33fc61994dcf0265a4f98e77a2f6947f455ae6de) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Show "Device genuine" when onboarding cannot say the firmware is current

## 0.4.0-next.0

### Minor Changes

- [#24069](https://github.com/LedgerHQ/ledger-live/pull/24069) [`33fc619`](https://github.com/LedgerHQ/ledger-live/commit/33fc61994dcf0265a4f98e77a2f6947f455ae6de) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Show "Device genuine" when onboarding cannot say the firmware is current

## 0.3.0

### Minor Changes

- [#23704](https://github.com/LedgerHQ/ledger-live/pull/23704) [`d316d23`](https://github.com/LedgerHQ/ledger-live/commit/d316d23562d9fc50834d308bf978f548aa032c57) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Close any open app before reading the device state, so the onboarding no longer falls back to the legacy flow

- [#23604](https://github.com/LedgerHQ/ledger-live/pull/23604) [`cc184a6`](https://github.com/LedgerHQ/ledger-live/commit/cc184a681ef7716368e8df7bab1a05abb9cb576d) Thanks [@sarneijim](https://github.com/sarneijim)! - Reset the device onboarding like a quit, and leave the genuine check screen even when quit comes before the device answered

- [#23699](https://github.com/LedgerHQ/ledger-live/pull/23699) [`c742800`](https://github.com/LedgerHQ/ledger-live/commit/c742800474dca6346e83690f414c31a747b0755f) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Offer Ledger Sync after the checks on a device that already has a seed, when the app passes offerSync

- [#23776](https://github.com/LedgerHQ/ledger-live/pull/23776) [`8d462cb`](https://github.com/LedgerHQ/ledger-live/commit/8d462cbfd64fec0e533396e7b7316a17550733bc) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep the checks success screen up until the user continues

## 0.3.0-next.0

### Minor Changes

- [#23704](https://github.com/LedgerHQ/ledger-live/pull/23704) [`d316d23`](https://github.com/LedgerHQ/ledger-live/commit/d316d23562d9fc50834d308bf978f548aa032c57) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Close any open app before reading the device state, so the onboarding no longer falls back to the legacy flow

- [#23604](https://github.com/LedgerHQ/ledger-live/pull/23604) [`cc184a6`](https://github.com/LedgerHQ/ledger-live/commit/cc184a681ef7716368e8df7bab1a05abb9cb576d) Thanks [@sarneijim](https://github.com/sarneijim)! - Reset the device onboarding like a quit, and leave the genuine check screen even when quit comes before the device answered

- [#23699](https://github.com/LedgerHQ/ledger-live/pull/23699) [`c742800`](https://github.com/LedgerHQ/ledger-live/commit/c742800474dca6346e83690f414c31a747b0755f) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Offer Ledger Sync after the checks on a device that already has a seed, when the app passes offerSync

- [#23776](https://github.com/LedgerHQ/ledger-live/pull/23776) [`8d462cb`](https://github.com/LedgerHQ/ledger-live/commit/8d462cbfd64fec0e533396e7b7316a17550733bc) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep the checks success screen up until the user continues

## 0.2.0

### Minor Changes

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23193](https://github.com/LedgerHQ/ledger-live/pull/23193) [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171) Thanks [@sarneijim](https://github.com/sarneijim)! - Run the genuine check again after a firmware update, with the early-check screen shown again

## 0.2.0-next.0

### Minor Changes

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23193](https://github.com/LedgerHQ/ledger-live/pull/23193) [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171) Thanks [@sarneijim](https://github.com/sarneijim)! - Run the genuine check again after a firmware update, with the early-check screen shown again

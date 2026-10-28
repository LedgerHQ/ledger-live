# @devtools/device-onboarding

## 0.5.0-next.0

### Minor Changes

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23680](https://github.com/LedgerHQ/ledger-live/pull/23680) [`e983155`](https://github.com/LedgerHQ/ledger-live/commit/e9831558eb3ee926d75cc14fbcad429fe8b656fc) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show each onboarding state in the devtool log with an icon and a color for its kind

- [#23875](https://github.com/LedgerHQ/ledger-live/pull/23875) [`f717fa9`](https://github.com/LedgerHQ/ledger-live/commit/f717fa924ea60f0e650b01cceb555be46bca510b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Align @tanstack/react-table catalog on 8.21.3 to drop the duplicate 8.5.11 install

### Patch Changes

- Updated dependencies [[`d316d23`](https://github.com/LedgerHQ/ledger-live/commit/d316d23562d9fc50834d308bf978f548aa032c57), [`cc184a6`](https://github.com/LedgerHQ/ledger-live/commit/cc184a681ef7716368e8df7bab1a05abb9cb576d), [`c742800`](https://github.com/LedgerHQ/ledger-live/commit/c742800474dca6346e83690f414c31a747b0755f), [`8d462cb`](https://github.com/LedgerHQ/ledger-live/commit/8d462cbfd64fec0e533396e7b7316a17550733bc)]:
  - @features/platform-device-onboarding@0.3.0-next.0

## 0.4.0

### Minor Changes

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23472](https://github.com/LedgerHQ/ledger-live/pull/23472) [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083) Thanks [@sarneijim](https://github.com/sarneijim)! - Add connectUnseededDevice to deviceOnboarding and edit that mock from the mobile onboarding devtool

### Patch Changes

- Updated dependencies [[`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171)]:
  - @features/platform-device-onboarding@0.2.0

## 0.4.0-next.0

### Minor Changes

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23472](https://github.com/LedgerHQ/ledger-live/pull/23472) [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083) Thanks [@sarneijim](https://github.com/sarneijim)! - Add connectUnseededDevice to deviceOnboarding and edit that mock from the mobile onboarding devtool

### Patch Changes

- Updated dependencies [[`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171)]:
  - @features/platform-device-onboarding@0.2.0-next.0

## 0.3.0

### Minor Changes

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#22979](https://github.com/LedgerHQ/ledger-live/pull/22979) [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep the Ledger Recovery Key backup as its own onboarding step

### Patch Changes

- Updated dependencies [[`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f), [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877), [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b)]:
  - @ledgerhq/device-onboarding@0.5.0

## 0.3.0-next.0

### Minor Changes

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#22979](https://github.com/LedgerHQ/ledger-live/pull/22979) [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep the Ledger Recovery Key backup as its own onboarding step

### Patch Changes

- Updated dependencies [[`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f), [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877), [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b)]:
  - @ledgerhq/device-onboarding@0.5.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`eddfcd4`](https://github.com/LedgerHQ/ledger-live/commit/eddfcd47ba49d55715ed9dc7a619867cd5a636d5)]:
  - @ledgerhq/device-onboarding@0.4.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`eddfcd4`](https://github.com/LedgerHQ/ledger-live/commit/eddfcd47ba49d55715ed9dc7a619867cd5a636d5)]:
  - @ledgerhq/device-onboarding@0.4.0-next.0

## 0.2.0

### Minor Changes

- [#22309](https://github.com/LedgerHQ/ledger-live/pull/22309) [`01473d6`](https://github.com/LedgerHQ/ledger-live/commit/01473d6dff53295312cef15863aff5abbf6ccf09) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the Device Onboarding devtool, which runs the shared onboarding flow against a real device

### Patch Changes

- Updated dependencies [[`07546c2`](https://github.com/LedgerHQ/ledger-live/commit/07546c22eabba5a381dc1c436410264333af5696), [`5c5656a`](https://github.com/LedgerHQ/ledger-live/commit/5c5656a533350c7b37d3000e0276bc6bae8263af)]:
  - @ledgerhq/device-onboarding@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#22309](https://github.com/LedgerHQ/ledger-live/pull/22309) [`01473d6`](https://github.com/LedgerHQ/ledger-live/commit/01473d6dff53295312cef15863aff5abbf6ccf09) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the Device Onboarding devtool, which runs the shared onboarding flow against a real device

### Patch Changes

- Updated dependencies [[`07546c2`](https://github.com/LedgerHQ/ledger-live/commit/07546c22eabba5a381dc1c436410264333af5696), [`5c5656a`](https://github.com/LedgerHQ/ledger-live/commit/5c5656a533350c7b37d3000e0276bc6bae8263af)]:
  - @ledgerhq/device-onboarding@0.3.0-next.0

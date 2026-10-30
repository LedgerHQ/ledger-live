# @shared/ui-app-unavailable

## 0.3.0-next.0

### Minor Changes

- [#23919](https://github.com/LedgerHQ/ledger-live/pull/23919) [`15727e0`](https://github.com/LedgerHQ/ledger-live/commit/15727e019193711acc999fa4e08fde1c3898dea6) Thanks [@ysitbon](https://github.com/ysitbon)! - `AppUnavailableAction` names its callback `onOpenLearnMore` instead of `onPress`, so the contract names the intent rather than a platform gesture.

## 0.2.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23296](https://github.com/LedgerHQ/ledger-live/pull/23296) [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321) Thanks [@LL782](https://github.com/LL782)! - Restore an optional Learn more action on the geo-blocking unavailable screen

## 0.2.0-next.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23296](https://github.com/LedgerHQ/ledger-live/pull/23296) [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321) Thanks [@LL782](https://github.com/LL782)! - Restore an optional Learn more action on the geo-blocking unavailable screen

## 0.1.0

### Minor Changes

- [#23130](https://github.com/LedgerHQ/ledger-live/pull/23130) [`5796861`](https://github.com/LedgerHQ/ledger-live/commit/5796861a76554861f2f2d56c4799e837c0e3d9ff) Thanks [@LL782](https://github.com/LL782)! - Add the full-screen app unavailable view

## 0.1.0-next.0

### Minor Changes

- [#23130](https://github.com/LedgerHQ/ledger-live/pull/23130) [`5796861`](https://github.com/LedgerHQ/ledger-live/commit/5796861a76554861f2f2d56c4799e837c0e3d9ff) Thanks [@LL782](https://github.com/LL782)! - Add the full-screen app unavailable view

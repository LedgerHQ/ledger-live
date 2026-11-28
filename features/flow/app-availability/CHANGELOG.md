# @features/flow-app-availability

## 0.4.0

### Minor Changes

- [#25026](https://github.com/LedgerHQ/ledger-live/pull/25026) [`4060186`](https://github.com/LedgerHQ/ledger-live/commit/40601866b3d1903e03be990373f9152ac3418223) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Add `selectAppAvailabilitySettled`, the store counterpart of `useAppAvailability` leaving pending

- [#25139](https://github.com/LedgerHQ/ledger-live/pull/25139) [`0201072`](https://github.com/LedgerHQ/ledger-live/commit/0201072c5e4d8b91d2da5f5e9430f84b31486b42) Thanks [@LL782](https://github.com/LL782)! - Keep the OFAC blocked screen when a refetch of the check fails after a 451

- [#24883](https://github.com/LedgerHQ/ledger-live/pull/24883) [`bb23f63`](https://github.com/LedgerHQ/ledger-live/commit/bb23f63969464f78d1e736b4d9d95881e7016e73) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Keep the app on screen at launch when a failed OFAC check is sent again

## 0.4.0-next.0

### Minor Changes

- [#25026](https://github.com/LedgerHQ/ledger-live/pull/25026) [`4060186`](https://github.com/LedgerHQ/ledger-live/commit/40601866b3d1903e03be990373f9152ac3418223) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Add `selectAppAvailabilitySettled`, the store counterpart of `useAppAvailability` leaving pending

- [#25139](https://github.com/LedgerHQ/ledger-live/pull/25139) [`0201072`](https://github.com/LedgerHQ/ledger-live/commit/0201072c5e4d8b91d2da5f5e9430f84b31486b42) Thanks [@LL782](https://github.com/LL782)! - Keep the OFAC blocked screen when a refetch of the check fails after a 451

- [#24883](https://github.com/LedgerHQ/ledger-live/pull/24883) [`bb23f63`](https://github.com/LedgerHQ/ledger-live/commit/bb23f63969464f78d1e736b4d9d95881e7016e73) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Keep the app on screen at launch when a failed OFAC check is sent again

## 0.3.2

### Patch Changes

- Updated dependencies [[`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/api-ofac@0.2.0

## 0.3.2-next.0

### Patch Changes

- Updated dependencies [[`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/api-ofac@0.2.0-next.0

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @domain/api-ofac@0.1.3

## 0.3.1-next.0

### Patch Changes

- Updated dependencies []:
  - @domain/api-ofac@0.1.3-next.0

## 0.3.0

### Minor Changes

- [#23919](https://github.com/LedgerHQ/ledger-live/pull/23919) [`15727e0`](https://github.com/LedgerHQ/ledger-live/commit/15727e019193711acc999fa4e08fde1c3898dea6) Thanks [@ysitbon](https://github.com/ysitbon)! - `AppUnavailableAction` names its callback `onOpenLearnMore` instead of `onPress`, so the contract names the intent rather than a platform gesture.

### Patch Changes

- Updated dependencies [[`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`15727e0`](https://github.com/LedgerHQ/ledger-live/commit/15727e019193711acc999fa4e08fde1c3898dea6), [`2a7ae74`](https://github.com/LedgerHQ/ledger-live/commit/2a7ae7400258f13f2daa1b6fe63149ae7748aaaa)]:
  - @shared/linking@0.4.0
  - @shared/ui-app-unavailable@0.3.0
  - @shared/i18n@0.2.0
  - @domain/api-ofac@0.1.2

## 0.3.0-next.0

### Minor Changes

- [#23919](https://github.com/LedgerHQ/ledger-live/pull/23919) [`15727e0`](https://github.com/LedgerHQ/ledger-live/commit/15727e019193711acc999fa4e08fde1c3898dea6) Thanks [@ysitbon](https://github.com/ysitbon)! - `AppUnavailableAction` names its callback `onOpenLearnMore` instead of `onPress`, so the contract names the intent rather than a platform gesture.

### Patch Changes

- Updated dependencies [[`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`15727e0`](https://github.com/LedgerHQ/ledger-live/commit/15727e019193711acc999fa4e08fde1c3898dea6), [`2a7ae74`](https://github.com/LedgerHQ/ledger-live/commit/2a7ae7400258f13f2daa1b6fe63149ae7748aaaa)]:
  - @shared/linking@0.4.0-next.0
  - @shared/ui-app-unavailable@0.3.0-next.0
  - @shared/i18n@0.2.0
  - @domain/api-ofac@0.1.2-next.0

## 0.2.0

### Minor Changes

- [#23296](https://github.com/LedgerHQ/ledger-live/pull/23296) [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321) Thanks [@LL782](https://github.com/LL782)! - Restore an optional Learn more action on the geo-blocking unavailable screen

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321)]:
  - @shared/ui-app-unavailable@0.2.0
  - @domain/api-ofac@0.1.1

## 0.2.0-next.0

### Minor Changes

- [#23296](https://github.com/LedgerHQ/ledger-live/pull/23296) [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321) Thanks [@LL782](https://github.com/LL782)! - Restore an optional Learn more action on the geo-blocking unavailable screen

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321)]:
  - @shared/ui-app-unavailable@0.2.0-next.0
  - @domain/api-ofac@0.1.1-next.0

## 0.1.0

### Minor Changes

- [#23177](https://github.com/LedgerHQ/ledger-live/pull/23177) [`4f028aa`](https://github.com/LedgerHQ/ledger-live/commit/4f028aa4af07c636f6c3590f8248f859f3edf98a) Thanks [@LL782](https://github.com/LL782)! - Add `@features/flow-app-availability`, the launch availability gate and OFAC check composition

### Patch Changes

- Updated dependencies [[`255f11e`](https://github.com/LedgerHQ/ledger-live/commit/255f11ecc0e26b4a5b3d6f6f45395a4de48eb5a2), [`5796861`](https://github.com/LedgerHQ/ledger-live/commit/5796861a76554861f2f2d56c4799e837c0e3d9ff)]:
  - @domain/api-ofac@0.1.0
  - @shared/ui-app-unavailable@0.1.0
  - @shared/i18n@0.2.0

## 0.1.0-next.0

### Minor Changes

- [#23177](https://github.com/LedgerHQ/ledger-live/pull/23177) [`4f028aa`](https://github.com/LedgerHQ/ledger-live/commit/4f028aa4af07c636f6c3590f8248f859f3edf98a) Thanks [@LL782](https://github.com/LL782)! - Add `@features/flow-app-availability`, the launch availability gate and OFAC check composition

### Patch Changes

- Updated dependencies [[`255f11e`](https://github.com/LedgerHQ/ledger-live/commit/255f11ecc0e26b4a5b3d6f6f45395a4de48eb5a2), [`5796861`](https://github.com/LedgerHQ/ledger-live/commit/5796861a76554861f2f2d56c4799e837c0e3d9ff)]:
  - @domain/api-ofac@0.1.0-next.0
  - @shared/ui-app-unavailable@0.1.0-next.0
  - @shared/i18n@0.2.0

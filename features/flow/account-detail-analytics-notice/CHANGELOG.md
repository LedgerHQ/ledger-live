# @features/flow-account-detail-analytics-notice

## 0.4.0-next.0

### Minor Changes

- [#24667](https://github.com/LedgerHQ/ledger-live/pull/24667) [`17a6fe5`](https://github.com/LedgerHQ/ledger-live/commit/17a6fe50223648ab962217e1388633d1d67c63a7) Thanks [@deepyjr](https://github.com/deepyjr)! - Show and force in the account-detail DevTools tool whether the install is eligible for the Analytics banner

- [#24593](https://github.com/LedgerHQ/ledger-live/pull/24593) [`5dff2e5`](https://github.com/LedgerHQ/ledger-live/commit/5dff2e54adbff5b6bc5ad2e57bbd6c5e6f85271a) Thanks [@deepyjr](https://github.com/deepyjr)! - Gate the Account Detail Analytics banner with the `accountDetail` `analyticsBanner` param, send it to analytics and keep the banner until it is closed

- [#24597](https://github.com/LedgerHQ/ledger-live/pull/24597) [`205aa4b`](https://github.com/LedgerHQ/ledger-live/commit/205aa4b7d5ef984fb020e08a05ca47ad08dff95c) Thanks [@deepyjr](https://github.com/deepyjr)! - Show the Account Detail Analytics banner only to installations that had completed onboarding with a device before the rollout, through a one-time persisted eligibility snapshot

## 0.3.0

### Minor Changes

- [#24325](https://github.com/LedgerHQ/ledger-live/pull/24325) [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4) Thanks [@deepyjr](https://github.com/deepyjr)! - Add an account-detail DevTools tool to reset the Account Detail card that redirects to Analytics

- [#24352](https://github.com/LedgerHQ/ledger-live/pull/24352) [`64c16b8`](https://github.com/LedgerHQ/ledger-live/commit/64c16b8200c14d691b104a99396c00252731be2a) Thanks [@deepyjr](https://github.com/deepyjr)! - Show the Analytics introduction on mobile Account Detail: the package exposes the introduction from a universal entry with a native view, and mobile persists its dismissal locally and passes the account scope (account, native asset, Balance) to Analytics.

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

- [#24196](https://github.com/LedgerHQ/ledger-live/pull/24196) [`77e21f9`](https://github.com/LedgerHQ/ledger-live/commit/77e21f9395f93b4ede8e70b68f3f74139622a25a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Account Detail Analytics introduction in a dedicated layout slot above the custom place, with dismissal persisted across desktop restarts and account entry context.

## 0.3.0-next.0

### Minor Changes

- [#24325](https://github.com/LedgerHQ/ledger-live/pull/24325) [`be81b1c`](https://github.com/LedgerHQ/ledger-live/commit/be81b1c79213926d7963e730fc8ccf4323e58db4) Thanks [@deepyjr](https://github.com/deepyjr)! - Add an account-detail DevTools tool to reset the Account Detail card that redirects to Analytics

- [#24352](https://github.com/LedgerHQ/ledger-live/pull/24352) [`64c16b8`](https://github.com/LedgerHQ/ledger-live/commit/64c16b8200c14d691b104a99396c00252731be2a) Thanks [@deepyjr](https://github.com/deepyjr)! - Show the Analytics introduction on mobile Account Detail: the package exposes the introduction from a universal entry with a native view, and mobile persists its dismissal locally and passes the account scope (account, native asset, Balance) to Analytics.

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

- [#24196](https://github.com/LedgerHQ/ledger-live/pull/24196) [`77e21f9`](https://github.com/LedgerHQ/ledger-live/commit/77e21f9395f93b4ede8e70b68f3f74139622a25a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Account Detail Analytics introduction in a dedicated layout slot above the custom place, with dismissal persisted across desktop restarts and account entry context.

## 0.2.0

### Minor Changes

- [#24194](https://github.com/LedgerHQ/ledger-live/pull/24194) [`512cbf6`](https://github.com/LedgerHQ/ledger-live/commit/512cbf64911823df2e76059524c7a56c51dafe55) Thanks [@deepyjr](https://github.com/deepyjr)! - Add confirmed-history eligibility and installation-wide Analytics introduction dismissal state.

## 0.2.0-next.0

### Minor Changes

- [#24194](https://github.com/LedgerHQ/ledger-live/pull/24194) [`512cbf6`](https://github.com/LedgerHQ/ledger-live/commit/512cbf64911823df2e76059524c7a56c51dafe55) Thanks [@deepyjr](https://github.com/deepyjr)! - Add confirmed-history eligibility and installation-wide Analytics introduction dismissal state.

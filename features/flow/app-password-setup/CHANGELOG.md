# @features/flow-app-password-setup

## 0.1.0

### Minor Changes

- [#22785](https://github.com/LedgerHQ/ledger-live/pull/22785) [`6225945`](https://github.com/LedgerHQ/ledger-live/commit/6225945749be628b088bbb65a102a40f984a569c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app password setup steps into their own flow package, `@features/flow-app-password-setup`.

  The Setup password and Confirm password steps (`useSetupPasswordViewModel`, `SetupPasswordView`, `useConfirmPasswordViewModel`, `ConfirmPasswordView`) leave `@features/flow-app-lock`, which no longer exports them, for `steps/SetupPassword` and `steps/ConfirmPassword` in the new package. The app's add-password screens import them from there, and the longer-password journey, still in `@features/flow-app-lock`, reuses them through the new package. Third step of splitting the app lock flow into one package per journey. No behaviour changes.

### Patch Changes

- Updated dependencies [[`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5)]:
  - @features/platform-app-lock@0.6.0
  - @shared/i18n@0.2.0

## 0.1.0-next.0

### Minor Changes

- [#22785](https://github.com/LedgerHQ/ledger-live/pull/22785) [`6225945`](https://github.com/LedgerHQ/ledger-live/commit/6225945749be628b088bbb65a102a40f984a569c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app password setup steps into their own flow package, `@features/flow-app-password-setup`.

  The Setup password and Confirm password steps (`useSetupPasswordViewModel`, `SetupPasswordView`, `useConfirmPasswordViewModel`, `ConfirmPasswordView`) leave `@features/flow-app-lock`, which no longer exports them, for `steps/SetupPassword` and `steps/ConfirmPassword` in the new package. The app's add-password screens import them from there, and the longer-password journey, still in `@features/flow-app-lock`, reuses them through the new package. Third step of splitting the app lock flow into one package per journey. No behaviour changes.

### Patch Changes

- Updated dependencies [[`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5)]:
  - @features/platform-app-lock@0.6.0-next.0
  - @shared/i18n@0.2.0

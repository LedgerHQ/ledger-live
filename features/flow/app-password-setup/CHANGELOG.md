# @features/flow-app-password-setup

## 0.2.0-next.0

### Minor Changes

- [#23937](https://github.com/LedgerHQ/ledger-live/pull/23937) [`18673dd`](https://github.com/LedgerHQ/ledger-live/commit/18673dd8b397566bdc7ccbf89d3834c81a807a26) Thanks [@ysitbon](https://github.com/ysitbon)! - `PasswordField`, `PasswordFieldProps`, `PasswordDraftProvider`, `usePasswordDraft` and `PasswordDraft` move to the native entry `@features/platform-app-lock/native`, and `@features/platform-app-lock` no longer exports them. The package imports carry no platform suffix and it typechecks a web and a native project.

### Patch Changes

- Updated dependencies [[`18673dd`](https://github.com/LedgerHQ/ledger-live/commit/18673dd8b397566bdc7ccbf89d3834c81a807a26)]:
  - @features/platform-app-lock@0.7.0-next.0
  - @shared/i18n@0.2.0

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

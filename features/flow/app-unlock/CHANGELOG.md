# @features/flow-app-unlock

## 0.2.0-next.0

### Minor Changes

- [#23937](https://github.com/LedgerHQ/ledger-live/pull/23937) [`18673dd`](https://github.com/LedgerHQ/ledger-live/commit/18673dd8b397566bdc7ccbf89d3834c81a807a26) Thanks [@ysitbon](https://github.com/ysitbon)! - `PasswordField`, `PasswordFieldProps`, `PasswordDraftProvider`, `usePasswordDraft` and `PasswordDraft` move to the native entry `@features/platform-app-lock/native`, and `@features/platform-app-lock` no longer exports them. The package imports carry no platform suffix and it typechecks a web and a native project.

### Patch Changes

- Updated dependencies [[`18673dd`](https://github.com/LedgerHQ/ledger-live/commit/18673dd8b397566bdc7ccbf89d3834c81a807a26), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766)]:
  - @features/platform-app-lock@0.7.0-next.0
  - @shared/ui-info-state@0.6.0-next.0
  - @shared/i18n@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c)]:
  - @shared/ui-info-state@0.5.0

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c)]:
  - @shared/ui-info-state@0.5.0-next.0

## 0.1.0

### Minor Changes

- [#22693](https://github.com/LedgerHQ/ledger-live/pull/22693) [`b18cbdb`](https://github.com/LedgerHQ/ledger-live/commit/b18cbdbabb25a9ffd1e44f7289f17fea4aba1266) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app unlock journey into its own flow package, `@features/flow-app-unlock`.

  The unlock screen (`useUnlockViewModel`, `UnlockView`, the splash and focus rules) and the forgotten password sheet leave `@features/flow-app-lock`, which no longer exports them. They follow the flow layout, `steps/Unlock` with the sheet under `steps/Unlock/components`, and the app's unlock screen imports them from the new package. Second step of splitting the app lock flow into one package per journey. No behaviour changes.

### Patch Changes

- Updated dependencies [[`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5)]:
  - @features/platform-app-lock@0.6.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0

## 0.1.0-next.0

### Minor Changes

- [#22693](https://github.com/LedgerHQ/ledger-live/pull/22693) [`b18cbdb`](https://github.com/LedgerHQ/ledger-live/commit/b18cbdbabb25a9ffd1e44f7289f17fea4aba1266) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app unlock journey into its own flow package, `@features/flow-app-unlock`.

  The unlock screen (`useUnlockViewModel`, `UnlockView`, the splash and focus rules) and the forgotten password sheet leave `@features/flow-app-lock`, which no longer exports them. They follow the flow layout, `steps/Unlock` with the sheet under `steps/Unlock/components`, and the app's unlock screen imports them from the new package. Second step of splitting the app lock flow into one package per journey. No behaviour changes.

### Patch Changes

- Updated dependencies [[`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5)]:
  - @features/platform-app-lock@0.6.0-next.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0

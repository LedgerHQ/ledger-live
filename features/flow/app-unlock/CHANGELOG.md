# @features/flow-app-unlock

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

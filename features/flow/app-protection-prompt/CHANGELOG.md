# @features/flow-app-protection-prompt

## 0.1.1

### Patch Changes

- Updated dependencies [[`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @shared/ui-queued-bottom-sheet@0.7.0
  - @shared/ui-info-state@0.5.0

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @shared/ui-queued-bottom-sheet@0.7.0-next.0
  - @shared/ui-info-state@0.5.0-next.0

## 0.1.0

### Minor Changes

- [#22828](https://github.com/LedgerHQ/ledger-live/pull/22828) [`9a947ef`](https://github.com/LedgerHQ/ledger-live/commit/9a947ef9a6cab8dc20865369676b13129fa7bf99) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app protection prompt — `useProtectionPromptViewModel`, `EnableProtectionSheet` and `ProtectionEnabledSheet` — into a new `@features/flow-app-protection-prompt` package, and delete `@features/flow-app-lock`, now empty. The app's protection prompt imports from the new package. Last step of splitting the app lock flow into one package per journey. No behaviour change.

### Patch Changes

- Updated dependencies [[`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5)]:
  - @features/platform-app-lock@0.6.0
  - @shared/analytics@0.4.0
  - @shared/analytics-react@0.4.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0

## 0.1.0-next.0

### Minor Changes

- [#22828](https://github.com/LedgerHQ/ledger-live/pull/22828) [`9a947ef`](https://github.com/LedgerHQ/ledger-live/commit/9a947ef9a6cab8dc20865369676b13129fa7bf99) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app protection prompt — `useProtectionPromptViewModel`, `EnableProtectionSheet` and `ProtectionEnabledSheet` — into a new `@features/flow-app-protection-prompt` package, and delete `@features/flow-app-lock`, now empty. The app's protection prompt imports from the new package. Last step of splitting the app lock flow into one package per journey. No behaviour change.

### Patch Changes

- Updated dependencies [[`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5)]:
  - @features/platform-app-lock@0.6.0-next.0
  - @shared/analytics@0.4.0
  - @shared/analytics-react@0.4.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0

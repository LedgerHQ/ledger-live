# @features/flow-app-protection-prompt

## 0.1.2-next.0

### Patch Changes

- Updated dependencies [[`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`18673dd`](https://github.com/LedgerHQ/ledger-live/commit/18673dd8b397566bdc7ccbf89d3834c81a807a26), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`9092dc3`](https://github.com/LedgerHQ/ledger-live/commit/9092dc350ccb833de3bd9b4254408a98cd264645), [`5eed48e`](https://github.com/LedgerHQ/ledger-live/commit/5eed48ed200b672ba41afb663c6b648628ebaf3e), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766)]:
  - @shared/analytics-react@0.5.0-next.0
  - @features/platform-app-lock@0.7.0-next.0
  - @shared/ui-info-state@0.6.0-next.0
  - @shared/ui-queued-bottom-sheet@0.8.0-next.0
  - @shared/analytics@0.4.0
  - @shared/i18n@0.2.0

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

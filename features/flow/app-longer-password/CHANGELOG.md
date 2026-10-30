# @features/flow-app-longer-password

## 0.1.2-next.0

### Patch Changes

- Updated dependencies [[`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`18673dd`](https://github.com/LedgerHQ/ledger-live/commit/18673dd8b397566bdc7ccbf89d3834c81a807a26), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`9092dc3`](https://github.com/LedgerHQ/ledger-live/commit/9092dc350ccb833de3bd9b4254408a98cd264645), [`5eed48e`](https://github.com/LedgerHQ/ledger-live/commit/5eed48ed200b672ba41afb663c6b648628ebaf3e), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766)]:
  - @shared/analytics-react@0.5.0-next.0
  - @features/flow-app-password-setup@0.2.0-next.0
  - @shared/ui-info-state@0.6.0-next.0
  - @shared/ui-queued-bottom-sheet@0.8.0-next.0
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

- [#22817](https://github.com/LedgerHQ/ledger-live/pull/22817) [`57b333d`](https://github.com/LedgerHQ/ledger-live/commit/57b333de5cab7b3e387aab8cb45de0a7705bd8ec) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the mandatory longer-password journey out of `@features/flow-app-lock` into a new `@features/flow-app-longer-password` package: `useLongerPasswordViewModel`, `LongerPasswordView` and its enter and confirm steps, `ChangePasswordSheet` and `PasswordChangedSheet`. The app's longer-password gate imports them from there, and the enter and confirm steps still reuse `@features/flow-app-password-setup`, which `@features/flow-app-lock` no longer depends on. No behaviour change.

### Patch Changes

- Updated dependencies [[`6225945`](https://github.com/LedgerHQ/ledger-live/commit/6225945749be628b088bbb65a102a40f984a569c)]:
  - @features/flow-app-password-setup@0.1.0
  - @shared/analytics-react@0.4.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0

## 0.1.0-next.0

### Minor Changes

- [#22817](https://github.com/LedgerHQ/ledger-live/pull/22817) [`57b333d`](https://github.com/LedgerHQ/ledger-live/commit/57b333de5cab7b3e387aab8cb45de0a7705bd8ec) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the mandatory longer-password journey out of `@features/flow-app-lock` into a new `@features/flow-app-longer-password` package: `useLongerPasswordViewModel`, `LongerPasswordView` and its enter and confirm steps, `ChangePasswordSheet` and `PasswordChangedSheet`. The app's longer-password gate imports them from there, and the enter and confirm steps still reuse `@features/flow-app-password-setup`, which `@features/flow-app-lock` no longer depends on. No behaviour change.

### Patch Changes

- Updated dependencies [[`6225945`](https://github.com/LedgerHQ/ledger-live/commit/6225945749be628b088bbb65a102a40f984a569c)]:
  - @features/flow-app-password-setup@0.1.0-next.0
  - @shared/analytics-react@0.4.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0

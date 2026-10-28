# @features/flow-app-password-removal

## 0.2.0-next.0

### Minor Changes

- [#23937](https://github.com/LedgerHQ/ledger-live/pull/23937) [`18673dd`](https://github.com/LedgerHQ/ledger-live/commit/18673dd8b397566bdc7ccbf89d3834c81a807a26) Thanks [@ysitbon](https://github.com/ysitbon)! - `PasswordField`, `PasswordFieldProps`, `PasswordDraftProvider`, `usePasswordDraft` and `PasswordDraft` move to the native entry `@features/platform-app-lock/native`, and `@features/platform-app-lock` no longer exports them. The package imports carry no platform suffix and it typechecks a web and a native project.

### Patch Changes

- Updated dependencies [[`18673dd`](https://github.com/LedgerHQ/ledger-live/commit/18673dd8b397566bdc7ccbf89d3834c81a807a26), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`9092dc3`](https://github.com/LedgerHQ/ledger-live/commit/9092dc350ccb833de3bd9b4254408a98cd264645), [`5eed48e`](https://github.com/LedgerHQ/ledger-live/commit/5eed48ed200b672ba41afb663c6b648628ebaf3e), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766)]:
  - @features/platform-app-lock@0.7.0-next.0
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

- [#22792](https://github.com/LedgerHQ/ledger-live/pull/22792) [`9894c78`](https://github.com/LedgerHQ/ledger-live/commit/9894c78c32b055686c15db66e8369a7a3b12748a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the password removal journey — the Deactivate password step and the sheet that keeps the last protection while a card is active — out of `@features/flow-app-lock` into a new `@features/flow-app-password-removal` package. The Settings password and biometrics rows and the Deactivate password screen import it from there. No behaviour change.

### Patch Changes

- Updated dependencies [[`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5)]:
  - @features/platform-app-lock@0.6.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0

## 0.1.0-next.0

### Minor Changes

- [#22792](https://github.com/LedgerHQ/ledger-live/pull/22792) [`9894c78`](https://github.com/LedgerHQ/ledger-live/commit/9894c78c32b055686c15db66e8369a7a3b12748a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the password removal journey — the Deactivate password step and the sheet that keeps the last protection while a card is active — out of `@features/flow-app-lock` into a new `@features/flow-app-password-removal` package. The Settings password and biometrics rows and the Deactivate password screen import it from there. No behaviour change.

### Patch Changes

- Updated dependencies [[`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5)]:
  - @features/platform-app-lock@0.6.0-next.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0

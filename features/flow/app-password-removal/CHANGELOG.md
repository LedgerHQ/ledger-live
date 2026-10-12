# @features/flow-app-password-removal

## 0.1.0-next.0

### Minor Changes

- [#22792](https://github.com/LedgerHQ/ledger-live/pull/22792) [`9894c78`](https://github.com/LedgerHQ/ledger-live/commit/9894c78c32b055686c15db66e8369a7a3b12748a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the password removal journey — the Deactivate password step and the sheet that keeps the last protection while a card is active — out of `@features/flow-app-lock` into a new `@features/flow-app-password-removal` package. The Settings password and biometrics rows and the Deactivate password screen import it from there. No behaviour change.

### Patch Changes

- Updated dependencies [[`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5)]:
  - @features/platform-app-lock@0.6.0-next.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0

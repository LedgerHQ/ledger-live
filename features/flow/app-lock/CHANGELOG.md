# @features/flow-app-lock

## 0.2.0-next.0

### Minor Changes

- [#20988](https://github.com/LedgerHQ/ledger-live/pull/20988) [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

  `@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

  Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.

### Patch Changes

- Updated dependencies [[`197acad`](https://github.com/LedgerHQ/ledger-live/commit/197acad8c74b6fe833ce8dbf78db472643b00819), [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb)]:
  - @features/platform-app-lock@0.2.0-next.0

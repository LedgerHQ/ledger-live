# @features/flow-app-lock

## 0.4.0

### Minor Changes

- [#21961](https://github.com/LedgerHQ/ledger-live/pull/21961) [`2b976be`](https://github.com/LedgerHQ/ledger-live/commit/2b976be3c7d61accd0911b439263be9d66f50508) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let someone remove their app lock password, behind `lwmPasswordRevamp`.

  Turning the switch off used to reach the legacy removal screen, which reads the default keychain item and compares plaintext. A revamped password lives under its own service as a verifier, so that screen could never succeed — and its `if (credentials)` guard skipped the comparison entirely when it found nothing, clearing legacy state without ever checking the password.

  The new screen derives with the parameters stored in the verifier rather than today's defaults, compares in constant time, and destroys the verifier before flipping the protection state. A wrong password and a keychain that will not answer are reported differently, since a single boolean forced one to be shown as the other.

  The screens also stop taking their strings as a `labels` object built by the app: each one now calls `useTranslation` from `@shared/i18n` where it renders, as the `pay-*` flows already do. That removes the `*Labels` types and the per-screen `useMemo` that rebuilt them, and turns the failure props into booleans so the state stays in the view model while the message lives in the view.

### Patch Changes

- Updated dependencies []:
  - @shared/i18n@0.2.0

## 0.4.0-next.0

### Minor Changes

- [#21961](https://github.com/LedgerHQ/ledger-live/pull/21961) [`2b976be`](https://github.com/LedgerHQ/ledger-live/commit/2b976be3c7d61accd0911b439263be9d66f50508) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let someone remove their app lock password, behind `lwmPasswordRevamp`.

  Turning the switch off used to reach the legacy removal screen, which reads the default keychain item and compares plaintext. A revamped password lives under its own service as a verifier, so that screen could never succeed — and its `if (credentials)` guard skipped the comparison entirely when it found nothing, clearing legacy state without ever checking the password.

  The new screen derives with the parameters stored in the verifier rather than today's defaults, compares in constant time, and destroys the verifier before flipping the protection state. A wrong password and a keychain that will not answer are reported differently, since a single boolean forced one to be shown as the other.

  The screens also stop taking their strings as a `labels` object built by the app: each one now calls `useTranslation` from `@shared/i18n` where it renders, as the `pay-*` flows already do. That removes the `*Labels` types and the per-screen `useMemo` that rebuilt them, and turns the failure props into booleans so the state stays in the view model while the message lives in the view.

### Patch Changes

- Updated dependencies []:
  - @shared/i18n@0.2.0

## 0.3.0

### Minor Changes

- [#21026](https://github.com/LedgerHQ/ledger-live/pull/21026) [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Store a scrypt verifier instead of the password itself. Confirming a password now derives a digest and persists `{version, scrypt, salt, digest}` in the keychain, so nothing that can be replayed as a password is kept anywhere.

  The protection state lands with it: two independent flags plus a session lock, keyed off "any protection is enabled" rather than on having a password, which is the coupling that makes biometrics-only impossible today.

  Ordering is the safety argument throughout — the whole verifier is one keychain item, so an interrupted write leaves the previous verifier or none, never a half-written pairing, and the state flips only once the write has landed. Derivations are serialised: two concurrent setups would otherwise interleave and store a verifier whose salt belongs to the other run.

  The password field also gains a length cap. It sits far above anything anyone types, and exists because deriving a digest is deliberately slow.

### Patch Changes

- Updated dependencies [[`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897)]:
  - @features/platform-app-lock@0.3.0

## 0.3.0-next.0

### Minor Changes

- [#21026](https://github.com/LedgerHQ/ledger-live/pull/21026) [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Store a scrypt verifier instead of the password itself. Confirming a password now derives a digest and persists `{version, scrypt, salt, digest}` in the keychain, so nothing that can be replayed as a password is kept anywhere.

  The protection state lands with it: two independent flags plus a session lock, keyed off "any protection is enabled" rather than on having a password, which is the coupling that makes biometrics-only impossible today.

  Ordering is the safety argument throughout — the whole verifier is one keychain item, so an interrupted write leaves the previous verifier or none, never a half-written pairing, and the state flips only once the write has landed. Derivations are serialised: two concurrent setups would otherwise interleave and store a verifier whose salt belongs to the other run.

  The password field also gains a length cap. It sits far above anything anyone types, and exists because deriving a digest is deliberately slow.

### Patch Changes

- Updated dependencies [[`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897)]:
  - @features/platform-app-lock@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#20988](https://github.com/LedgerHQ/ledger-live/pull/20988) [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

  `@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

  Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.

### Patch Changes

- Updated dependencies [[`197acad`](https://github.com/LedgerHQ/ledger-live/commit/197acad8c74b6fe833ce8dbf78db472643b00819), [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb)]:
  - @features/platform-app-lock@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#20988](https://github.com/LedgerHQ/ledger-live/pull/20988) [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

  `@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

  Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.

### Patch Changes

- Updated dependencies [[`197acad`](https://github.com/LedgerHQ/ledger-live/commit/197acad8c74b6fe833ce8dbf78db472643b00819), [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb)]:
  - @features/platform-app-lock@0.2.0-next.0

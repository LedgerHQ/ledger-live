# @shared/ui-info-state

## 0.3.0-next.0

### Minor Changes

- [#22163](https://github.com/LedgerHQ/ledger-live/pull/22163) [`944bd23`](https://github.com/LedgerHQ/ledger-live/commit/944bd2345899c399bc931144fe46b48d0d1bf55b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Tell a user who has forgotten their app-lock password what their options are, from the unlock screen.

  The link was already on the unlock screen and the flow package already accepted the callback, but nothing in the app provided it — so the link never rendered and there was no answer to give.

  There is no recovery to offer, and that is the point of the scheme: the password is not stored, only a verifier derived from it, so nothing can reverse it. The sheet says so and names the one way back — reinstalling the app, which drops the lock along with the app's data. That advice is only true now that protection outliving its install is destroyed at boot; before, on iOS the keychain survived an uninstall and the reinstall demanded the very password the user had forgotten.

  The sheet is absent for a user protected by biometrics alone, who has no password to forget.

  The sheet lives in the flow package with the screen that raises it, which needed `@shared/ui-info-state` to offer `./native` and `./web` entries beside its conditional root: a `features/flow` package can only reach the root through the `react-native` condition, and that condition resolves Lumen to source and demands its whole native peer graph. Existing consumers keep importing the root, and keep the conditions they had.

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf)]:
  - @shared/ui-queued-bottom-sheet@0.4.0

## 0.2.2-next.0

### Patch Changes

- Updated dependencies [[`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf)]:
  - @shared/ui-queued-bottom-sheet@0.4.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6)]:
  - @shared/ui-queued-bottom-sheet@0.3.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6)]:
  - @shared/ui-queued-bottom-sheet@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#21164](https://github.com/LedgerHQ/ledger-live/pull/21164) [`a2be85c`](https://github.com/LedgerHQ/ledger-live/commit/a2be85cd773ae59e454cd33b9a38548ea5b003f8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire Pay Request Verify on mobile (intro sheet, DIE address confirmation, tracking).
  Share `getAddressVerification` (maps refuse / unsupported) in the platform intent package.

- [#21139](https://github.com/LedgerHQ/ledger-live/pull/21139) [`848b4bd`](https://github.com/LedgerHQ/ledger-live/commit/848b4bd3cccf6cb38f9e31ec39a0d4bc574c3fa2) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the InfoState component (and its web-only dialog background tone plumbing) out of ledger-live-desktop and live-mobile into a new shared package, @shared/ui-info-state, so it can be reused in the DDD architecture

### Patch Changes

- Updated dependencies [[`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de), [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77)]:
  - @shared/ui-queued-bottom-sheet@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#21164](https://github.com/LedgerHQ/ledger-live/pull/21164) [`a2be85c`](https://github.com/LedgerHQ/ledger-live/commit/a2be85cd773ae59e454cd33b9a38548ea5b003f8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire Pay Request Verify on mobile (intro sheet, DIE address confirmation, tracking).
  Share `getAddressVerification` (maps refuse / unsupported) in the platform intent package.

- [#21139](https://github.com/LedgerHQ/ledger-live/pull/21139) [`848b4bd`](https://github.com/LedgerHQ/ledger-live/commit/848b4bd3cccf6cb38f9e31ec39a0d4bc574c3fa2) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the InfoState component (and its web-only dialog background tone plumbing) out of ledger-live-desktop and live-mobile into a new shared package, @shared/ui-info-state, so it can be reused in the DDD architecture

### Patch Changes

- Updated dependencies [[`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de), [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77)]:
  - @shared/ui-queued-bottom-sheet@0.2.0-next.0

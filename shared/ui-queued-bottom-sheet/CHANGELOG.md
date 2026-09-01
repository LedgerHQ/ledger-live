# @shared/ui-queued-bottom-sheet

## 0.2.0-next.0

### Minor Changes

- [#20973](https://github.com/LedgerHQ/ledger-live/pull/20973) [`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile bottom sheets that could not be reopened after being closed.

- [#21151](https://github.com/LedgerHQ/ledger-live/pull/21151) [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the odd Add contact transition on Mobile by focusing the contact name field only once the drawer has finished opening, so the keyboard no longer resizes the dynamically sized drawer mid-animation. Adds an onOpened callback to QueuedBottomSheet and makes ContactNameInput focus reactively rather than only on mount.

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

- [#21177](https://github.com/LedgerHQ/ledger-live/pull/21177) [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the mobile Contacts edit address sheet staying hidden behind the keyboard, and retract the keyboard when a bottom sheet starts closing so the sheet can be reopened afterwards.

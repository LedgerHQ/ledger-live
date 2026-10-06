# @shared/ui-queued-bottom-sheet

## 0.6.0

### Minor Changes

- [#22511](https://github.com/LedgerHQ/ledger-live/pull/22511) [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix drag-and-drop reordering in the card's manage-assets sheet, which never got the gesture

  - `QueuedBottomSheet` takes `enableContentPanningGesture`, so content that owns a drag gesture can stop the sheet's own pan from claiming it.
  - The manage-assets scene turns that gesture off and its list is no longer scrollable, leaving the drag uncontested and letting the sheet size to its rows.
  - The row being dragged takes a `surfacePressed` background.
  - The balance filter sheet sizes to its options instead of always opening at full height, with the confirm button pinned in the sheet's own footer slot.

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

- [#22501](https://github.com/LedgerHQ/ledger-live/pull/22501) [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix a bottom sheet reopening right after being swiped down before its entrance animation finished. Only a dismissal started for a previous presentation now puts the sheet back on screen.

- [#22616](https://github.com/LedgerHQ/ledger-live/pull/22616) [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix Android taps ignored in the Card Details More menu right after dragging the sheet

## 0.6.0-next.0

### Minor Changes

- [#22511](https://github.com/LedgerHQ/ledger-live/pull/22511) [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix drag-and-drop reordering in the card's manage-assets sheet, which never got the gesture

  - `QueuedBottomSheet` takes `enableContentPanningGesture`, so content that owns a drag gesture can stop the sheet's own pan from claiming it.
  - The manage-assets scene turns that gesture off and its list is no longer scrollable, leaving the drag uncontested and letting the sheet size to its rows.
  - The row being dragged takes a `surfacePressed` background.
  - The balance filter sheet sizes to its options instead of always opening at full height, with the confirm button pinned in the sheet's own footer slot.

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

- [#22501](https://github.com/LedgerHQ/ledger-live/pull/22501) [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix a bottom sheet reopening right after being swiped down before its entrance animation finished. Only a dismissal started for a previous presentation now puts the sheet back on screen.

- [#22616](https://github.com/LedgerHQ/ledger-live/pull/22616) [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix Android taps ignored in the Card Details More menu right after dragging the sheet

## 0.5.0

### Minor Changes

- [#21747](https://github.com/LedgerHQ/ledger-live/pull/21747) [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix keyboard handling in the mobile Contacts add, edit, and send flows. Input sheets now open at full height with the keyboard, primary actions remain visible in a keyboard-aware `QueuedBottomSheet` footer, and name fields focus immediately and capitalize each word.

- [#22271](https://github.com/LedgerHQ/ledger-live/pull/22271) [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the blank sheet that could appear when adding contacts one after another on iOS. A sheet is now dismissed once per presentation, and a dismissal nobody asked for puts the sheet back on screen instead of hiding the content of the presentation the user has just opened. A sheet that reaches the screen after being considered closed is dismissed once it animates, which is the point gorhom stops ignoring the request.

- [#22489](https://github.com/LedgerHQ/ledger-live/pull/22489) [`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix a bottom sheet reopening right after being swiped down before its entrance animation finished. Only a dismissal started for a previous presentation now puts the sheet back on screen.

- [#22135](https://github.com/LedgerHQ/ledger-live/pull/22135) [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add opt-in restoration of queued bottom sheets after navigation

## 0.5.0-next.1

### Minor Changes

- [#22489](https://github.com/LedgerHQ/ledger-live/pull/22489) [`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix a bottom sheet reopening right after being swiped down before its entrance animation finished. Only a dismissal started for a previous presentation now puts the sheet back on screen.

## 0.5.0-next.0

### Minor Changes

- [#21747](https://github.com/LedgerHQ/ledger-live/pull/21747) [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix keyboard handling in the mobile Contacts add, edit, and send flows. Input sheets now open at full height with the keyboard, primary actions remain visible in a keyboard-aware `QueuedBottomSheet` footer, and name fields focus immediately and capitalize each word.

- [#22271](https://github.com/LedgerHQ/ledger-live/pull/22271) [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the blank sheet that could appear when adding contacts one after another on iOS. A sheet is now dismissed once per presentation, and a dismissal nobody asked for puts the sheet back on screen instead of hiding the content of the presentation the user has just opened. A sheet that reaches the screen after being considered closed is dismissed once it animates, which is the point gorhom stops ignoring the request.

- [#22135](https://github.com/LedgerHQ/ledger-live/pull/22135) [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add opt-in restoration of queued bottom sheets after navigation

## 0.4.0

### Minor Changes

- [#21681](https://github.com/LedgerHQ/ledger-live/pull/21681) [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation error handling with retry

## 0.4.0-next.0

### Minor Changes

- [#21681](https://github.com/LedgerHQ/ledger-live/pull/21681) [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation error handling with retry

## 0.3.0

### Minor Changes

- [#21577](https://github.com/LedgerHQ/ledger-live/pull/21577) [`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Ship a QueuedBottomSheet test double from `@shared/ui-queued-bottom-sheet/testing` and map it by default in the features/flow native jest project, so sheet-hosting views no longer hand-roll a mock per test.

## 0.3.0-next.0

### Minor Changes

- [#21577](https://github.com/LedgerHQ/ledger-live/pull/21577) [`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Ship a QueuedBottomSheet test double from `@shared/ui-queued-bottom-sheet/testing` and map it by default in the features/flow native jest project, so sheet-hosting views no longer hand-roll a mock per test.

## 0.2.0

### Minor Changes

- [#20973](https://github.com/LedgerHQ/ledger-live/pull/20973) [`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile bottom sheets that could not be reopened after being closed.

- [#21151](https://github.com/LedgerHQ/ledger-live/pull/21151) [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the odd Add contact transition on Mobile by focusing the contact name field only once the drawer has finished opening, so the keyboard no longer resizes the dynamically sized drawer mid-animation. Adds an onOpened callback to QueuedBottomSheet and makes ContactNameInput focus reactively rather than only on mount.

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

- [#21177](https://github.com/LedgerHQ/ledger-live/pull/21177) [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the mobile Contacts edit address sheet staying hidden behind the keyboard, and retract the keyboard when a bottom sheet starts closing so the sheet can be reopened afterwards.

## 0.2.0-next.0

### Minor Changes

- [#20973](https://github.com/LedgerHQ/ledger-live/pull/20973) [`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile bottom sheets that could not be reopened after being closed.

- [#21151](https://github.com/LedgerHQ/ledger-live/pull/21151) [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the odd Add contact transition on Mobile by focusing the contact name field only once the drawer has finished opening, so the keyboard no longer resizes the dynamically sized drawer mid-animation. Adds an onOpened callback to QueuedBottomSheet and makes ContactNameInput focus reactively rather than only on mount.

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

- [#21177](https://github.com/LedgerHQ/ledger-live/pull/21177) [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the mobile Contacts edit address sheet staying hidden behind the keyboard, and retract the keyboard when a bottom sheet starts closing so the sheet can be reopened afterwards.

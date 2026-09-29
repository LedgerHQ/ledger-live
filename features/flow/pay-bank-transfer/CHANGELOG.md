# @features/flow-pay-bank-transfer

## 0.4.0-next.0

### Minor Changes

- [#22577](https://github.com/LedgerHQ/ledger-live/pull/22577) [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay analytics events that never reached Segment, and align the feature-intro page names.

  Pay tracking no longer travels through a React context: `@features/platform-pay-analytics` exposes
  module-level trackers built on `@shared/analytics`, and every Pay flow imports the one it needs.
  The provider could not be reached from inside `@gorhom/bottom-sheet` portals on mobile, so the card
  details sheet and the reward-currencies CTA silently dropped their events. The `onTrackEvent` prop
  is gone from every Pay flow package and from both host apps.

  Card milestone events are now planned from a first-read baseline, so they no longer replay on each
  login. Feature-intro pages report as `Page Feature Intro <flow>`, and the bank transfer flow is
  named `Cash to stable` instead of `C2S`.

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d)]:
  - @features/platform-pay-analytics@0.3.0-next.0
  - @shared/ui-queued-bottom-sheet@0.6.0-next.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315)]:
  - @shared/ui-queued-bottom-sheet@0.5.0

## 0.3.2-next.1

### Patch Changes

- Updated dependencies [[`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.1

## 0.3.2-next.0

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf)]:
  - @shared/ui-queued-bottom-sheet@0.4.0
  - @shared/i18n@0.2.0

## 0.3.1-next.0

### Patch Changes

- Updated dependencies [[`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf)]:
  - @shared/ui-queued-bottom-sheet@0.4.0-next.0
  - @shared/i18n@0.2.0

## 0.3.0

### Minor Changes

- [#21359](https://github.com/LedgerHQ/ledger-live/pull/21359) [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Route the Noah webview to signup or signin when noahAuth is set (LIVE-35383).

- [#21299](https://github.com/LedgerHQ/ledger-live/pull/21299) [`ac0311e`](https://github.com/LedgerHQ/ledger-live/commit/ac0311e70c2aabb091a0e4d32deaf1cf6e849a5a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Present the Pay cash-to-stable intro as a desktop dialog before the Noah handoff (LIVE-35383).

- [#21298](https://github.com/LedgerHQ/ledger-live/pull/21298) [`91bae2a`](https://github.com/LedgerHQ/ledger-live/commit/91bae2a0cf5af0f407b4d797b023d07e4ba95fbf) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Present the Pay cash-to-stable intro as a mobile bottom sheet, then hand off create/login to Noah (LIVE-35382).

### Patch Changes

- Updated dependencies [[`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6)]:
  - @shared/ui-queued-bottom-sheet@0.3.0

## 0.3.0-next.0

### Minor Changes

- [#21359](https://github.com/LedgerHQ/ledger-live/pull/21359) [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Route the Noah webview to signup or signin when noahAuth is set (LIVE-35383).

- [#21299](https://github.com/LedgerHQ/ledger-live/pull/21299) [`ac0311e`](https://github.com/LedgerHQ/ledger-live/commit/ac0311e70c2aabb091a0e4d32deaf1cf6e849a5a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Present the Pay cash-to-stable intro as a desktop dialog before the Noah handoff (LIVE-35383).

- [#21298](https://github.com/LedgerHQ/ledger-live/pull/21298) [`91bae2a`](https://github.com/LedgerHQ/ledger-live/commit/91bae2a0cf5af0f407b4d797b023d07e4ba95fbf) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Present the Pay cash-to-stable intro as a mobile bottom sheet, then hand off create/login to Noah (LIVE-35382).

### Patch Changes

- Updated dependencies [[`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6)]:
  - @shared/ui-queued-bottom-sheet@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#21233](https://github.com/LedgerHQ/ledger-live/pull/21233) [`5fbec35`](https://github.com/LedgerHQ/ledger-live/commit/5fbec35e1e9ff5a2de6e159ed9d82a1339d517c6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add the shared Pay bank-transfer cash-to-stable intro view-model and props-only views (LIVE-35381).

## 0.2.0-next.0

### Minor Changes

- [#21233](https://github.com/LedgerHQ/ledger-live/pull/21233) [`5fbec35`](https://github.com/LedgerHQ/ledger-live/commit/5fbec35e1e9ff5a2de6e159ed9d82a1339d517c6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add the shared Pay bank-transfer cash-to-stable intro view-model and props-only views (LIVE-35381).

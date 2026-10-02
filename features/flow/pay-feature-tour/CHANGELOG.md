# @features/flow-pay-feature-tour

## 0.7.0-next.1

### Minor Changes

- [#22834](https://github.com/LedgerHQ/ledger-live/pull/22834) [`739334b`](https://github.com/LedgerHQ/ledger-live/commit/739334b0d854a3b11d9a2b6ba47ce022dc0797d9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay feature tour card row when the pay-tab flag's card param is off

## 0.7.0-next.0

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

- [#22440](https://github.com/LedgerHQ/ledger-live/pull/22440) [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix remaining Pay Mixpanel events and user properties from the tracking plan

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d)]:
  - @features/platform-pay-analytics@0.3.0-next.0
  - @shared/ui-queued-bottom-sheet@0.6.0-next.0

## 0.6.0

### Minor Changes

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858), [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886), [`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315)]:
  - @shared/ui-queued-bottom-sheet@0.5.0
  - @features/platform-pay-analytics@0.2.0

## 0.6.0-next.1

### Patch Changes

- Updated dependencies [[`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.1

## 0.6.0-next.0

### Minor Changes

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858), [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.0
  - @features/platform-pay-analytics@0.2.0-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf)]:
  - @shared/ui-queued-bottom-sheet@0.4.0
  - @shared/i18n@0.2.0

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf)]:
  - @shared/ui-queued-bottom-sheet@0.4.0-next.0
  - @shared/i18n@0.2.0

## 0.5.0

### Minor Changes

- [#21373](https://github.com/LedgerHQ/ledger-live/pull/21373) [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Update the Pay feature tour copy, icons, and hero to match mockups (LIVE-36497).

### Patch Changes

- Updated dependencies [[`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6)]:
  - @shared/ui-queued-bottom-sheet@0.3.0
  - @shared/i18n@0.2.0

## 0.5.0-next.0

### Minor Changes

- [#21373](https://github.com/LedgerHQ/ledger-live/pull/21373) [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Update the Pay feature tour copy, icons, and hero to match mockups (LIVE-36497).

### Patch Changes

- Updated dependencies [[`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6)]:
  - @shared/ui-queued-bottom-sheet@0.3.0-next.0
  - @shared/i18n@0.2.0

## 0.4.0

### Minor Changes

- [#21131](https://github.com/LedgerHQ/ledger-live/pull/21131) [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename the Pay flow packages to drop the redundant `card` segment: `@features/flow-pay-card-balance` → `@features/flow-pay-balance`, `@features/flow-pay-card-deposit` → `@features/flow-pay-deposit`, and `@features/flow-pay-card-feature-tour` → `@features/flow-pay-feature-tour`. Package paths, npm names and all imports are updated; persisted Redux state keys and component test IDs are unchanged.

- [#21265](https://github.com/LedgerHQ/ledger-live/pull/21265) [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `@shared/i18n`, a thin i18n context bridge so `features/*` and `domain/*` components can call `useTranslation()` and render `<Trans>` instead of receiving translated strings as props.

  Both apps now build their i18next engine with an explicit `createInstance()` rather than the global singleton, and mount `<I18nProvider>` at their root alongside the existing `<I18nextProvider>`. Non-React call sites import the app instance (`~/renderer/i18n/init` on Desktop, `~/i18n/instance` on Mobile) instead of `i18next`, enforced by a lint rule.

  `@features/flow-pay-feature-tour` is the pilot: it resolves its own `payTab.featureTour.*` copy and no longer takes any copy props.

### Patch Changes

- Updated dependencies [[`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de), [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77), [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193)]:
  - @shared/ui-queued-bottom-sheet@0.2.0
  - @shared/i18n@0.2.0

## 0.4.0-next.0

### Minor Changes

- [#21131](https://github.com/LedgerHQ/ledger-live/pull/21131) [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename the Pay flow packages to drop the redundant `card` segment: `@features/flow-pay-card-balance` → `@features/flow-pay-balance`, `@features/flow-pay-card-deposit` → `@features/flow-pay-deposit`, and `@features/flow-pay-card-feature-tour` → `@features/flow-pay-feature-tour`. Package paths, npm names and all imports are updated; persisted Redux state keys and component test IDs are unchanged.

- [#21265](https://github.com/LedgerHQ/ledger-live/pull/21265) [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `@shared/i18n`, a thin i18n context bridge so `features/*` and `domain/*` components can call `useTranslation()` and render `<Trans>` instead of receiving translated strings as props.

  Both apps now build their i18next engine with an explicit `createInstance()` rather than the global singleton, and mount `<I18nProvider>` at their root alongside the existing `<I18nextProvider>`. Non-React call sites import the app instance (`~/renderer/i18n/init` on Desktop, `~/i18n/instance` on Mobile) instead of `i18next`, enforced by a lint rule.

  `@features/flow-pay-feature-tour` is the pilot: it resolves its own `payTab.featureTour.*` copy and no longer takes any copy props.

### Patch Changes

- Updated dependencies [[`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de), [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77), [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193)]:
  - @shared/ui-queued-bottom-sheet@0.2.0-next.0
  - @shared/i18n@0.2.0-next.0

## 0.3.0

### Minor Changes

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

- [#20546](https://github.com/LedgerHQ/ledger-live/pull/20546) [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add persistable hasSeenFeatureTour flag to the payCard feature-tour slice (markPayCardFeatureTourSeen, restorePayCardFeatureTour, selectPayCardHasSeenFeatureTour, payCardFeatureTourPersistedSelector)

## 0.3.0-next.0

### Minor Changes

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

- [#20546](https://github.com/LedgerHQ/ledger-live/pull/20546) [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add persistable hasSeenFeatureTour flag to the payCard feature-tour slice (markPayCardFeatureTourSeen, restorePayCardFeatureTour, selectPayCardHasSeenFeatureTour, payCardFeatureTourPersistedSelector)

## 0.2.0

### Minor Changes

- [#20591](https://github.com/LedgerHQ/ledger-live/pull/20591) [`d6b78ab`](https://github.com/LedgerHQ/ledger-live/commit/d6b78ab3fbb995a523ba10454006654ea5c801ce) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the first-time Pay tab FeatureTour flow: shared view-model driving visibility from the payCard slice, native QueuedBottomSheet UI and web Dialog UI with a hero image, subtitle, and three Lumen ListItem feature rows, plus injected analytics (onTrackScreen / onTrackEvent).

### Patch Changes

- Updated dependencies [[`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c)]:
  - @domain/entity-pay-card@0.3.0
  - @shared/ui-queued-bottom-sheet@0.1.0

## 0.2.0-next.0

### Minor Changes

- [#20591](https://github.com/LedgerHQ/ledger-live/pull/20591) [`d6b78ab`](https://github.com/LedgerHQ/ledger-live/commit/d6b78ab3fbb995a523ba10454006654ea5c801ce) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the first-time Pay tab FeatureTour flow: shared view-model driving visibility from the payCard slice, native QueuedBottomSheet UI and web Dialog UI with a hero image, subtitle, and three Lumen ListItem feature rows, plus injected analytics (onTrackScreen / onTrackEvent).

### Patch Changes

- Updated dependencies [[`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c)]:
  - @domain/entity-pay-card@0.3.0-next.0
  - @shared/ui-queued-bottom-sheet@0.1.0

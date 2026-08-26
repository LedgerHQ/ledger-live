# @features/flow-pay-feature-tour

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

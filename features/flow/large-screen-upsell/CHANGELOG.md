# @features/flow-large-screen-upsell

## 0.4.0-next.0

### Minor Changes

- [#19994](https://github.com/LedgerHQ/ledger-live/pull/19994) [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal UTM attribution on mobile and desktop

### Patch Changes

- Updated dependencies [[`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd)]:
  - @shared/feature-flags@0.16.0-next.0
  - @features/platform-feature-flags@0.6.3-next.0

## 0.3.0

### Minor Changes

- [#19927](https://github.com/LedgerHQ/ledger-live/pull/19927) [`c22be1e`](https://github.com/LedgerHQ/ledger-live/commit/c22be1ebd9598f04cbc6c04811832c4811d99b13) Thanks [@sarneijim](https://github.com/sarneijim)! - Update the Desktop large-screen upsell opt-out copy and CTA.

- [#19713](https://github.com/LedgerHQ/ledger-live/pull/19713) [`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add large-screen upsell QA debug screen and domain setters for simulating modal state

- [#19875](https://github.com/LedgerHQ/ledger-live/pull/19875) [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate the large-screen upsell modal by the enabled state of the selected opt-in variant

### Patch Changes

- Updated dependencies [[`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @domain/entity-large-screen-upsell-modal@0.3.0
  - @shared/feature-flags@0.15.0
  - @features/platform-feature-flags@0.6.2

## 0.3.0-next.0

### Minor Changes

- [#19927](https://github.com/LedgerHQ/ledger-live/pull/19927) [`c22be1e`](https://github.com/LedgerHQ/ledger-live/commit/c22be1ebd9598f04cbc6c04811832c4811d99b13) Thanks [@sarneijim](https://github.com/sarneijim)! - Update the Desktop large-screen upsell opt-out copy and CTA.

- [#19713](https://github.com/LedgerHQ/ledger-live/pull/19713) [`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add large-screen upsell QA debug screen and domain setters for simulating modal state

- [#19875](https://github.com/LedgerHQ/ledger-live/pull/19875) [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate the large-screen upsell modal by the enabled state of the selected opt-in variant

### Patch Changes

- Updated dependencies [[`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @domain/entity-large-screen-upsell-modal@0.3.0-next.0
  - @shared/feature-flags@0.15.0-next.0
  - @features/platform-feature-flags@0.6.2-next.0

## 0.2.0

### Minor Changes

- [#19667](https://github.com/LedgerHQ/ledger-live/pull/19667) [`40a231e`](https://github.com/LedgerHQ/ledger-live/commit/40a231e524f3d2d6edccaae5928d65da23aae6fe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Segment analytics for the large-screen upsell modal (LIVE-33163): flow dismiss/CTA lifecycle ports and desktop trackPage/track wiring.

- [#19643](https://github.com/LedgerHQ/ledger-live/pull/19643) [`1cc6fff`](https://github.com/LedgerHQ/ledger-live/commit/1cc6fff890d36ae12f81047882ae6e6e6fd2bac8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add large-screen upsell modal UI on desktop (LIVE-33162).

- [#19618](https://github.com/LedgerHQ/ledger-live/pull/19618) [`93da625`](https://github.com/LedgerHQ/ledger-live/commit/93da62553369efbd30f8837a7ff30c5890ad889b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Create `@features/flow-large-screen-upsell`, the audience/cooldown eligibility and frequency-throttle decision for the large-screen upsell modal. Exports `getLargeScreenUpsellDecision`, a pure function taking `userState` and `context` arguments, and `useLargeScreenUpsellDecision`, a hook wiring the `largeScreenUpsell` feature flag and the `@domain/entity-large-screen-upsell-modal` selectors into it. Stacked on the domain-entity package (#19617); UI, persistence, and analytics land in follow-up PRs.

### Patch Changes

- Updated dependencies [[`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`dccffa5`](https://github.com/LedgerHQ/ledger-live/commit/dccffa5c573922066d2ea0b1aba78cfa73a4fd37), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @shared/feature-flags@0.14.0
  - @domain/entity-large-screen-upsell-modal@0.2.0
  - @features/platform-feature-flags@0.6.1

## 0.2.0-next.0

### Minor Changes

- [#19667](https://github.com/LedgerHQ/ledger-live/pull/19667) [`40a231e`](https://github.com/LedgerHQ/ledger-live/commit/40a231e524f3d2d6edccaae5928d65da23aae6fe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Segment analytics for the large-screen upsell modal (LIVE-33163): flow dismiss/CTA lifecycle ports and desktop trackPage/track wiring.

- [#19643](https://github.com/LedgerHQ/ledger-live/pull/19643) [`1cc6fff`](https://github.com/LedgerHQ/ledger-live/commit/1cc6fff890d36ae12f81047882ae6e6e6fd2bac8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add large-screen upsell modal UI on desktop (LIVE-33162).

- [#19618](https://github.com/LedgerHQ/ledger-live/pull/19618) [`93da625`](https://github.com/LedgerHQ/ledger-live/commit/93da62553369efbd30f8837a7ff30c5890ad889b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Create `@features/flow-large-screen-upsell`, the audience/cooldown eligibility and frequency-throttle decision for the large-screen upsell modal. Exports `getLargeScreenUpsellDecision`, a pure function taking `userState` and `context` arguments, and `useLargeScreenUpsellDecision`, a hook wiring the `largeScreenUpsell` feature flag and the `@domain/entity-large-screen-upsell-modal` selectors into it. Stacked on the domain-entity package (#19617); UI, persistence, and analytics land in follow-up PRs.

### Patch Changes

- Updated dependencies [[`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`dccffa5`](https://github.com/LedgerHQ/ledger-live/commit/dccffa5c573922066d2ea0b1aba78cfa73a4fd37), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @shared/feature-flags@0.14.0-next.0
  - @domain/entity-large-screen-upsell-modal@0.2.0-next.0
  - @features/platform-feature-flags@0.6.1-next.0

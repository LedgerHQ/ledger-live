# @features/flow-large-screen-upsell

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

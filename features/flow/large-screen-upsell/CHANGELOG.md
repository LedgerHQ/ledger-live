# @features/flow-large-screen-upsell

## 2.0.1-next.0

### Patch Changes

- Updated dependencies [[`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e)]:
  - @shared/feature-flags@0.21.0-next.0
  - @features/platform-feature-flags@0.6.8-next.0

## 2.0.0

### Major Changes

- [#20834](https://github.com/LedgerHQ/ledger-live/pull/20834) [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a My Wallet Profile LNS upsell banner gated by `largeScreenUpsell.banners.profile` (LIVE-35481). Require `utmContent` on `buildLargeScreenUpsellCtaLink` and export `LARGE_SCREEN_UPSELL_UTM`.

### Minor Changes

- [#20874](https://github.com/LedgerHQ/ledger-live/pull/20874) [`1d6c394`](https://github.com/LedgerHQ/ledger-live/commit/1d6c39482047fef5b86a4b9511a3e8a1956e30a1) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Warn Backup Hub Recovery Key for Nano S, SP and X and open the upgrade landing page

- [#20876](https://github.com/LedgerHQ/ledger-live/pull/20876) [`1ba0ceb`](https://github.com/LedgerHQ/ledger-live/commit/1ba0ceb64143f29712b8c8d68871e12a4b6ad065) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Block Recover on desktop for Nano S-only wallets with a dismissible upgrade modal (LIVE-35465).

- [#20925](https://github.com/LedgerHQ/ledger-live/pull/20925) [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Gate Recover Nano S intercept and Backup Hub Recovery Key warning with `largeScreenUpsell.params.banners["recover-page-block-nano-s-only"]` and `banners["backup-hub-recovery-key-text-warning"]`.

- [#20956](https://github.com/LedgerHQ/ledger-live/pull/20956) [`41311d6`](https://github.com/LedgerHQ/ledger-live/commit/41311d69b2d29dac534c98f6bd2917f7b558c14e) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add shop UTMs on hardware carousel card clicks in the desktop portfolio

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @shared/feature-flags@0.20.0
  - @features/platform-feature-flags@0.6.7

## 2.0.0-next.0

### Major Changes

- [#20834](https://github.com/LedgerHQ/ledger-live/pull/20834) [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a My Wallet Profile LNS upsell banner gated by `largeScreenUpsell.banners.profile` (LIVE-35481). Require `utmContent` on `buildLargeScreenUpsellCtaLink` and export `LARGE_SCREEN_UPSELL_UTM`.

### Minor Changes

- [#20874](https://github.com/LedgerHQ/ledger-live/pull/20874) [`1d6c394`](https://github.com/LedgerHQ/ledger-live/commit/1d6c39482047fef5b86a4b9511a3e8a1956e30a1) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Warn Backup Hub Recovery Key for Nano S, SP and X and open the upgrade landing page

- [#20876](https://github.com/LedgerHQ/ledger-live/pull/20876) [`1ba0ceb`](https://github.com/LedgerHQ/ledger-live/commit/1ba0ceb64143f29712b8c8d68871e12a4b6ad065) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Block Recover on desktop for Nano S-only wallets with a dismissible upgrade modal (LIVE-35465).

- [#20925](https://github.com/LedgerHQ/ledger-live/pull/20925) [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Gate Recover Nano S intercept and Backup Hub Recovery Key warning with `largeScreenUpsell.params.banners["recover-page-block-nano-s-only"]` and `banners["backup-hub-recovery-key-text-warning"]`.

- [#20956](https://github.com/LedgerHQ/ledger-live/pull/20956) [`41311d6`](https://github.com/LedgerHQ/ledger-live/commit/41311d69b2d29dac534c98f6bd2917f7b558c14e) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add shop UTMs on hardware carousel card clicks in the desktop portfolio

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @shared/feature-flags@0.20.0-next.0
  - @features/platform-feature-flags@0.6.7-next.0

## 1.0.0

### Major Changes

- [#20833](https://github.com/LedgerHQ/ledger-live/pull/20833) [`2ab3cb8`](https://github.com/LedgerHQ/ledger-live/commit/2ab3cb881721e73ab3ad2f7ee6d6587e08e78530) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Require `utmContent` on `buildLargeScreenUpsellCtaLink` (breaking) and personalise the Backup Hub Recovery Key row for Nano S / SP / X with a warning and large-screen upsell CTA (LIVE-35484).

### Minor Changes

- [#20789](https://github.com/LedgerHQ/ledger-live/pull/20789) [`fe57525`](https://github.com/LedgerHQ/ledger-live/commit/fe57525f64607881552bf8c32edf2e5a78aca641) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix Large Screen Upsell competing-modal handling on desktop: do not consume retriesModal when blocked/preempted, rename persisted retries to retriesModal (legacy reset on LWD only), and track modal_blocked.

- [#20803](https://github.com/LedgerHQ/ledger-live/pull/20803) [`13d6db5`](https://github.com/LedgerHQ/ledger-live/commit/13d6db554a98dbbeed492f90caca8c962ba217d1) Thanks [@sarneijim](https://github.com/sarneijim)! - Extend desktop always-on upsell banners to Nano SP and Nano X using the shared largeScreenUpsell audience and cooldown (LIVE-35397).

### Patch Changes

- Updated dependencies [[`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c)]:
  - @shared/feature-flags@0.19.0
  - @features/platform-feature-flags@0.6.6

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @shared/feature-flags@0.19.0-next.1
  - @features/platform-feature-flags@0.6.6-next.1

## 1.0.0-next.0

### Major Changes

- [#20833](https://github.com/LedgerHQ/ledger-live/pull/20833) [`2ab3cb8`](https://github.com/LedgerHQ/ledger-live/commit/2ab3cb881721e73ab3ad2f7ee6d6587e08e78530) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Require `utmContent` on `buildLargeScreenUpsellCtaLink` (breaking) and personalise the Backup Hub Recovery Key row for Nano S / SP / X with a warning and large-screen upsell CTA (LIVE-35484).

### Minor Changes

- [#20789](https://github.com/LedgerHQ/ledger-live/pull/20789) [`fe57525`](https://github.com/LedgerHQ/ledger-live/commit/fe57525f64607881552bf8c32edf2e5a78aca641) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix Large Screen Upsell competing-modal handling on desktop: do not consume retriesModal when blocked/preempted, rename persisted retries to retriesModal (legacy reset on LWD only), and track modal_blocked.

- [#20803](https://github.com/LedgerHQ/ledger-live/pull/20803) [`13d6db5`](https://github.com/LedgerHQ/ledger-live/commit/13d6db554a98dbbeed492f90caca8c962ba217d1) Thanks [@sarneijim](https://github.com/sarneijim)! - Extend desktop always-on upsell banners to Nano SP and Nano X using the shared largeScreenUpsell audience and cooldown (LIVE-35397).

### Patch Changes

- Updated dependencies [[`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c)]:
  - @shared/feature-flags@0.19.0-next.0
  - @features/platform-feature-flags@0.6.6-next.0

## 0.5.0

### Minor Changes

- [#20458](https://github.com/LedgerHQ/ledger-live/pull/20458) [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd) Thanks [@sarneijim](https://github.com/sarneijim)! - Use legacy onboarding date fallback in large-screen upsell eligibility

- [#20333](https://github.com/LedgerHQ/ledger-live/pull/20333) [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Inline large-screen upsell modal entity state into the flow package

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de)]:
  - @shared/feature-flags@0.18.0
  - @features/platform-feature-flags@0.6.5

## 0.5.0-next.0

### Minor Changes

- [#20458](https://github.com/LedgerHQ/ledger-live/pull/20458) [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd) Thanks [@sarneijim](https://github.com/sarneijim)! - Use legacy onboarding date fallback in large-screen upsell eligibility

- [#20333](https://github.com/LedgerHQ/ledger-live/pull/20333) [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Inline large-screen upsell modal entity state into the flow package

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de)]:
  - @shared/feature-flags@0.18.0-next.0
  - @features/platform-feature-flags@0.6.5-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3)]:
  - @shared/feature-flags@0.17.0
  - @features/platform-feature-flags@0.6.4

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3)]:
  - @shared/feature-flags@0.17.0-next.0
  - @features/platform-feature-flags@0.6.4-next.0

## 0.4.0

### Minor Changes

- [#19994](https://github.com/LedgerHQ/ledger-live/pull/19994) [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal UTM attribution on mobile and desktop

### Patch Changes

- Updated dependencies [[`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd)]:
  - @shared/feature-flags@0.16.0
  - @features/platform-feature-flags@0.6.3

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

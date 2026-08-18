# @features/flow-pay-card-deposit

## 0.2.0-next.0

### Minor Changes

- [#20842](https://github.com/LedgerHQ/ledger-live/pull/20842) [`841f7a0`](https://github.com/LedgerHQ/ledger-live/commit/841f7a0991ee0a8036f2144858b5d27d654910bc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the shared Pay Card Deposit options component and view-model to `@features/flow-pay-card-deposit`: a Lumen dialog on desktop and a bottom sheet on mobile listing the four deposit options (bank transfer, swap, receive, buy), emitting host-owned navigation intents via `onSelect` and tracking via the injected `onTrackEvent`.

- [#20844](https://github.com/LedgerHQ/ledger-live/pull/20844) [`5ff320a`](https://github.com/LedgerHQ/ledger-live/commit/5ff320aaa967388af5d1e3f8d869b42739d0a2ed) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the desktop Pay tab "Add stablecoin" tile to the shared Deposit options dialog: pressing it opens the dialog and each option routes to its desktop flow (bank transfer, swap, buy) or the receive asset flow filtered to stablecoins.

  Render the deposit options as Lumen `ListItem` rows.

- [#20856](https://github.com/LedgerHQ/ledger-live/pull/20856) [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay tab "Add stablecoin" tile to the shared Deposit options overlay on both platforms: pressing it opens the dialog (desktop) or bottom sheet (mobile), and each option routes to its platform flow (bank transfer, swap, buy) or the receive flow filtered to stablecoins.

  Extract a shared `useDepositOptionsAdapter` hook in `@features/flow-pay-card-deposit` so desktop and mobile no longer duplicate the deposit options open/close state and props shape.

- [#20812](https://github.com/LedgerHQ/ledger-live/pull/20812) [`4faf5cd`](https://github.com/LedgerHQ/ledger-live/commit/4faf5cdcd91e183777a275123bb7d5c3890adbce) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the @features/flow-pay-card-deposit dual-platform flow package (empty public API) so the Pay tab Deposit options component and view-model can be added in follow-up tickets.

# @features/flow-pay-card-wallets

## 0.2.0-next.0

### Minor Changes

- [#21000](https://github.com/LedgerHQ/ledger-live/pull/21000) [`b053fc7`](https://github.com/LedgerHQ/ledger-live/commit/b053fc79c49c604e765ac7d3d793471196be9ae1) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - New package joining the card's funding wallets to their balances:

  - `combineCardLinkedWallets` — joins the two wallet endpoints on `id`, orders by Baanx's charging priority, and totals the counter-values.
  - `useCardLinkedWallets` — runs both reads in parallel and memoizes the join.
  - The counter-value conversion is an injected port, so resolving Baanx's `currency`/`network` onto a Ledger currency stays in the app.
  - `isPartialTotal` flags a total that is understating, because a balance or a rate was missing.

### Patch Changes

- Updated dependencies [[`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @domain/api-card-management@0.5.0-next.0

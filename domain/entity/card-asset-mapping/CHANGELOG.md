# @domain/entity-card-asset-mapping

## 0.6.0

### Minor Changes

- [#21569](https://github.com/LedgerHQ/ledger-live/pull/21569) [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Resolve a card-linked wallet to the Ledger currency it holds.

  - New `@domain/entity-card-asset-mapping` maps a card provider's `{currency}.{network}` id onto a Ledger currency id. `baanxCatalog.ts` holds Baanx's, covering USDT, USDC, BTC, ETH, XRP, SOL and LTC; a second provider is a second catalog beside it.
  - Several of Baanx's keys map onto one currency: its docs name the chain, its sandbox has answered with the ticker repeated, and both resolve.
  - `getCardLinkedWallets` attaches `ledgerId` in its transform, so every consumer reads one answer rather than mapping again.
  - The join and the devtool carry it through; an unmapped pair has no `ledgerId` at all rather than resolving to a wrong currency.
  - A "Currency Mapping" screen in the devtool lists the whole catalog, scrollable both ways, so a gap can be read against it.

## 0.6.0-next.0

### Minor Changes

- [#21569](https://github.com/LedgerHQ/ledger-live/pull/21569) [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Resolve a card-linked wallet to the Ledger currency it holds.

  - New `@domain/entity-card-asset-mapping` maps a card provider's `{currency}.{network}` id onto a Ledger currency id. `baanxCatalog.ts` holds Baanx's, covering USDT, USDC, BTC, ETH, XRP, SOL and LTC; a second provider is a second catalog beside it.
  - Several of Baanx's keys map onto one currency: its docs name the chain, its sandbox has answered with the ticker repeated, and both resolve.
  - `getCardLinkedWallets` attaches `ledgerId` in its transform, so every consumer reads one answer rather than mapping again.
  - The join and the devtool carry it through; an unmapped pair has no `ledgerId` at all rather than resolving to a wrong currency.
  - A "Currency Mapping" screen in the devtool lists the whole catalog, scrollable both ways, so a gap can be read against it.

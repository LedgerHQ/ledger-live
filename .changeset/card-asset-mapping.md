---
"@domain/entity-card-asset-mapping": minor
"@domain/api-card-management": minor
"@features/flow-pay-card-wallets": minor
"@devtools/pay-card": minor
"@devtools/bindings": minor
---

Resolve a card-linked wallet to the Ledger currency it holds.

- New `@domain/entity-card-asset-mapping` maps a card provider's `{currency}.{network}` id onto a Ledger currency id. `baanxCatalog.ts` holds Baanx's, covering USDT, USDC, BTC, ETH, XRP, SOL and LTC; a second provider is a second catalog beside it.
- Several of Baanx's keys map onto one currency: its docs name the chain, its sandbox has answered with the ticker repeated, and both resolve.
- `getCardLinkedWallets` attaches `ledgerId` in its transform, so every consumer reads one answer rather than mapping again.
- The join and the devtool carry it through; an unmapped pair stays `undefined` rather than resolving to a wrong currency.

---
"@domain/entity-pay-card-asset": minor
"@domain/api-card-management": minor
"@features/flow-pay-card-wallets": minor
"@devtools/pay-card": minor
"@devtools/bindings": minor
---

Resolve a card-linked wallet to the Ledger currency it holds.

- New `@domain/entity-pay-card-asset` maps the provider's `{currency}.{network}` id onto a Ledger currency id, covering USDT, USDC, BTC, ETH, XRP, SOL and LTC.
- Several provider keys map onto one currency: its docs name the chain, its sandbox has answered with the ticker repeated, and both resolve.
- `getCardLinkedWallets` attaches `ledgerId` in its transform, so every consumer reads one answer rather than mapping again.
- The join and the devtool carry it through; an unmapped pair stays `undefined` rather than resolving to a wrong currency.
- A "Currency Mapping" screen in the devtool lists the whole catalog, scrollable both ways, so a gap can be read against it.

---
"@features/flow-pay-card": minor
"live-mobile": minor
---

Show the real card balance: the total of the wallets linked to the card.

- `useCardViewModel` reads `useCardLinkedWallets().total` instead of a placeholder, and passes `isLoading` to the visual.
- `CardProps` takes `resolveCounterValue`; the wallet queries are skipped without it, so hosts that omit it are unaffected.
- Mobile resolves a Baanx ticker to a Ledger currency via the stablecoin catalog, then prices it with the app's countervalue state. An asset outside that catalog resolves to `null`, which the total reports as partial rather than as zero.

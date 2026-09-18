---
"@features/flow-pay-card": minor
"@features/flow-pay-card-assets": minor
---

Show the card's real balance on its face, instead of a mocked one.

- The balance is the funding wallets' worth, summed; the provider reports no total.
- A wallet nothing could price adds nothing, so the balance can understate what the card holds.
- The face shows the wallets query's own loading state while the first read is in flight.
- A failed read, or a host that lists no assets, keeps the bare artwork: a formatted zero would read as a real balance.
- `useCardWalletsTotal` is published from the assets package; the list keeps its own pricing for the rows it formats.

---
"@features/flow-pay-card-details": minor
"@features/flow-pay-card": minor
---

Make the card details `.` entry the same on both platforms. `CardArtwork` takes one props contract, `CardArtworkProps`, whose `size` applies on web only. `CardPrimaryActionButton` moves to the `./web` entry with its props type. `CardTopUpButton`, `Freeze`, `More` and `CardVisual` are no longer exported. `pay-card` imports `CardPrimaryActionButton` from `@features/flow-pay-card-details/web`.

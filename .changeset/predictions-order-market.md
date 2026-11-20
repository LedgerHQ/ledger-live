---
"@features/flow-predictions": minor
"@features/platform-predictions": minor
"@shared/ui-info-state": minor
"@shared/ui-queued-bottom-sheet": minor
"@support/jest": patch
"ledger-live-desktop": minor
"live-mobile": minor
---

Show a filled Predictions order's market and amounts: `custom.predictions.signOrder` takes a `display` (event and market titles, outcome and its Yes / No side, image on Polymarket's image host only). A filled order's description says what was bought for the amount signed ("You bought 16.13 shares for $5.00", or "You paid $5.00"), with the market under it; other outcomes don't show the market. On mobile the order's result is a full screen with the outcome's glow instead of a bottom sheet

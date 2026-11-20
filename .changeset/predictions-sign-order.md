---
"@features/flow-predictions": minor
"@features/platform-predictions": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add `custom.predictions.signOrder` and `custom.predictions.reportOrder`: Ledger Wallet signs the Predictions buy order on the device in its own sheet, accepting only MoonPay's `BoxPolymarketPlaceOrder` authorization for an all-or-nothing buy and refusing to sign it once expired, then shows the order's result in the same sheet. `signOrder` answers an `orderId` that `reportOrder` takes, so a late report can't reach a newer order

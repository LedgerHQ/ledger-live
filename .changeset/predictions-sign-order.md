---
"@features/flow-predictions": minor
"@features/platform-predictions": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add `custom.predictions.signOrder` and `custom.predictions.reportOrder`: Ledger Wallet signs the Predictions buy order on the device in its own sheet, accepting only MoonPay's `BoxPolymarketPlaceOrder` authorization for an all-or-nothing buy and refusing to sign it once expired, then shows the order's result: in the same dialog on desktop, and on mobile on its own page once the locked "Placing your order" sheet has gone. `signOrder` answers a `walletOrderId` that `reportOrder` takes with the order's `status`, so a late report can't reach a newer order

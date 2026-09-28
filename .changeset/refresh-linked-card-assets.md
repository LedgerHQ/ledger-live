---
"live-mobile": minor
"ledger-live-desktop": minor
"@features/flow-pay-card-wallets": minor
"@features/flow-pay-card-assets": minor
"@features/flow-pay-card-auth": minor
"@domain/api-card-management": minor
---

Refresh linked card assets when returning from Baanx, without restarting the app.

- Closing the secure browser after Add asset or Access Baanx drops the cached linked and internal wallets, so a newly linked asset shows up on the Pay tab.
- Returning to the desktop Pay tab refetches the linked wallets, because leaving Pay unmounts that list.
- Opening a hosted card page now returns whether it opened, instead of reporting failures through a callback.

---
"ledger-live-desktop": minor
---

Auto-select the asset and account in the Wallet 4.0 right-panel Swap when the user is on an Asset Detail page: the route's currency is set as the receive asset, and the highest-balance account for that currency is preselected (single account when only one exists, none when there are no accounts). The embedded swap webview is keyed on the currency and account so navigating between asset detail pages reloads the live app with the updated selection instead of showing the asset/account dialog.

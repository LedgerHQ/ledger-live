---
"ledger-live-desktop": minor
---

Fix exchange back button to use returnTo and persist across webview navigation

- Exchange header back now navigates to the route passed as `returnTo` in location state (or `/` as fallback) instead of `navigate(-1)`, so back leaves the exchange in desktop context instead of stepping within WebPTXPlayer history
- Initial `returnTo` is stored in a ref so it survives in-webview navigations that overwrite `location.state`
- All entry points that navigate to `/exchange` (Market buy/sell, FundAccount, QuickActions, account/asset headers, etc.) now pass `returnTo: location.pathname` in state

---
"live-mobile": patch
"@features/platform-aggregated-assets": minor
---

The mobile account picker no longer opens on the currency of an earlier request. Leaving the add-account device flow with the back button or swipe-back now cancels the pending account request and resets the picker, as the close button does. The picker also stops auto-selecting a single asset while it still shows a previous request's results. `useAssetsData` now returns `isStale` for this case.

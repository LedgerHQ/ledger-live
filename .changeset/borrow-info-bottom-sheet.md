---
"live-mobile": minor
---

Add Borrow info bottom sheet for the mobile Borrow Live App, with a dedicated Redux slice (`borrow.infoBottomSheet`) and a `custom.bottomSheet.info` wallet API handler so the embedded webview can open contextual help drawers. The `InfoBottomSheet` view is now shared between the Borrow and Earn Live Apps.

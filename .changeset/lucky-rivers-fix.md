---
"ledger-live-desktop": patch
"live-mobile": patch
---

fix See details button navigation in swap multi-step flow

- wire `custom.swapRedirectToHistory` handler in the `/swap-web` desktop route so clicking See details navigates to `/swap/history`
- update `navigateToSwapHistory` on mobile to route into `SwapNavigator` when on the v4 tab stack, falling back to `SwapSubScreens` on the legacy stack

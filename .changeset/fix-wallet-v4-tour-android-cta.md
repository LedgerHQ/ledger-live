---
"live-mobile": patch
---

fix(mobile): Wallet V4 Tour drawer Continue button not responding on Android

Set pointerEvents so only the visible CTA receives touches (Continue vs Explore). On Android the stacked button with opacity 0 was capturing taps and closing the drawer instead of advancing the slide.

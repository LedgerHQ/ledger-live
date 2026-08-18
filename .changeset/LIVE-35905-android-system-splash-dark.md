---
"live-mobile": patch
---

Force a dark background on the Android 12+ system splash screen shown between the launcher tap and the splash screen. It followed the device theme, showing a white background in light mode, because the `windowSplashScreenBackground` it was configured with belongs to `core-splashscreen` and never reached the platform.

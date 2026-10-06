---
"live-mobile": patch
---

Bump `react-native-reanimated` to 4.3.4 so animated views no longer revert to their initial values after a heavy JS-thread load at startup, which left the portfolio gauge cursor at 0 and the `AmountDisplay` digits overlapping.

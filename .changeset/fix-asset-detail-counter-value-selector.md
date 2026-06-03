---
"live-mobile": patch
---

Asset Detail market price now follows the user's settings counter-value. The hook previously sourced the counter-value from the Market screen's Redux state, which defaulted to USD and only changed when the user opened the Market list. It now reads `counterValueCurrencySelector` from settings, matching the desktop behaviour.

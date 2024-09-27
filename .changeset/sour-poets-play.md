---
"live-mobile": patch
---

fix(LLM): wallet-connect deep-link from native app for a request would reload the page

Reloading the page would break the wallet-api flow shown when coming back to the app

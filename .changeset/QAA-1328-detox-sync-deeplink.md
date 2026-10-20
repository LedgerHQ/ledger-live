---
"ledger-live-mobile-e2e-tests": minor
---

Disable Detox synchronization while the Buy/Sell deeplink opens the live app webview, so the busy network no longer hangs the wait. Give the native wait's hard timeout headroom past its own timeout so it stops abandoning in-flight calls, and drop unused `async` from the bridge `setFeatureFlag` and the buy/sell and deposit test factories.

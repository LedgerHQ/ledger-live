---
"live-mobile": minor
---

Fix Earn dashboard losing its background and main navigation (top bar + tab bar) after returning from an in-webview intent flow (deposit/withdraw/simulate). The active flow is now derived from the live webview URL instead of the stale native `intent` param, and the app navigates back to the Earn dashboard tab when the flow is exited.

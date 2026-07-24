---
"live-mobile": patch
---

Fix Swap: pressing "<" from the History screen after a multi-step swap now returns to the initial input form instead of the transaction success screen. The webview is remounted when redirecting to History so the success screen is no longer left mounted underneath.

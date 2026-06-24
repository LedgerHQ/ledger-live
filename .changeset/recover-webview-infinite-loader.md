---
"ledger-live-desktop": minor
---

Fix full-screen live apps (e.g. Recover) getting stuck on an infinite loader on cold start. The webview's `did-finish-load` listener was attached via an effect keyed on a stable ref, so on a cold start it could attach after the webview had already finished loading and miss the event, leaving `widgetLoaded` false forever. The listener now keys off the mounted webview node and recovers if the load already completed.

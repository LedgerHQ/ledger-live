---
"ledger-live-desktop": minor
---

Harden the Live App webview load so full-screen apps (e.g. Recover) can no longer get stuck on an infinite loader on cold start:

- The `did-finish-load` listener now keys off the mounted webview node (not a stable ref) and recovers if the load already completed, so a mount-timing race can't leave `widgetLoaded` false forever.
- Bound the load with a timeout: if the webview never finishes loading (e.g. its document response stalls mid-stream on a cold start), fall back to the existing network-error/retry screen instead of spinning indefinitely.
- Stop leaking React Router's splat (`*`) into the webview URL as a junk query param.

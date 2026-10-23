---
"live-mobile": minor
---

Enforce manifest domains on the Live App main frame when `llmWebviewManifestDomainCheck` is on: native synchronous check on Android, real `isTopFrame` on both platforms, about:/blob:/data: iframes allowed on iOS, and window.open limited to https and Ledger deeplinks.

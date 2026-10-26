---
"live-mobile": minor
---

Enforce manifest domains on the Live App main frame when `llmWebviewManifestDomainCheck` is on: a main frame committed outside them (e.g. an Android POST navigation) is stopped and the WebView unmounted, real `isTopFrame` on both platforms, about:/blob:/data: iframes allowed on iOS, and window.open limited to https and Ledger deeplinks.

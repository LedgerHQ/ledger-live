---
"ledger-live-desktop": minor
---

Fix orphaned Live App `<webview>` DevTools window on Electron 42: leaving a Live App now reliably closes its DevTools window again. The previous cleanup relied on the webview's `devtools-opened` / `devToolsWebContents` capture, which became unreliable on Electron 42 and left the DevTools window open; it is now discovered app-wide via its `devtools://` URL.

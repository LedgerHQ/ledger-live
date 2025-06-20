---
"live-mobile": minor
---

Earn live app now includes multi-screen flows. Handle back navigation within live app via webview back press, revert to the native navigation back press when on the initial screen - when view query param is set to 'amount'.

Extract the Earn live app from the WebPTXPlayer and into an independent, minimal Web3AppWebview wrapper that includes only earn-specific handlers.

---
"ledger-live-desktop": minor
---

Fix dapp integration breaking when a Live App's Content-Security-Policy blocks inline script injection, by evaluating the Ethereum provider in the page main world via webFrame.executeJavaScript instead of an inline <script> tag

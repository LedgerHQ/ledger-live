---
"live-mobile": minor
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
---

Add `go-to-swap` action to the Borrow live app `custom.navigate` wallet API handler so the embedded webview can deep-link users into the Swap flow with prefilled currency, token, account, amount and affiliate parameters. Unify the desktop handler naming with mobile (`custom.borrow.navigate` → `custom.navigate`), share the handler implementation across apps via a new `@ledgerhq/live-common/wallet-api/Borrow/navigate` module, and drop the redundant desktop `PageHeader` now that navigation is driven from the webview.

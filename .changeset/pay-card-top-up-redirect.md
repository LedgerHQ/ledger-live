---
"@features/flow-pay-card-auth": minor
"@features/flow-pay-card-details": minor
"@features/flow-pay-card-widget": minor
"@features/flow-pay-card": minor
"@features/platform-card": minor
"ledger-live-desktop": minor
---

Open the provider's top up page from the card on desktop.

- `CardTopUpButton` carries the action. On desktop it stays at the bottom of the card panel, above the scrolling content.
- Desktop opens `/topup` on the hosted live app manifest, the way the signup page already opens.
- A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.
- Desktop ends the provider session in the webview on each entry of the Pay tab, so a session left behind by a top up cannot sign the previous holder back in. The login and the signup drop their own wipe: every one of them starts from an entry of the Pay tab.

---
"@features/flow-pay-card-auth": minor
"@features/flow-pay-card-details": minor
"@features/flow-pay-card": minor
"@features/platform-card": minor
"live-mobile": minor
---

Open the provider's top up page from the card on mobile.

- The Top up button takes the place of the disabled "Coming soon" action on the card face, and it comes back at the bottom of the card details sheet.
- Mobile opens `/topup` in the secure browser, which carries the provider session. A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.

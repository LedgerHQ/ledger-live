---
"@features/flow-pay-card-auth": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Open the provider withdrawal page from a card asset.

- `buildWithdrawalPath` addresses `/withdrawal`, with the same `app_id` and `currency` query as `buildTopUpPath`.
- Desktop opens it on the hosted manifest, mobile in the secure browser, both with the asset pre-selected.
- Mobile also pre-selects the asset on the top up page.

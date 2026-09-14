---
"@devtools/pay-card": minor
---

Give the desktop devtool the screens the mobile one has.

- "Card Status" runs the endpoint probes and requests the rendered card details.
- "Card onboarding" shows each derived step, the count and the answer it was worked out from; the step toggles stay mobile-only, because only the mobile app mocks the Card endpoints.
- "Currency Mapping" lists the asset catalog, scrollable sideways so a long Ledger id is not truncated.

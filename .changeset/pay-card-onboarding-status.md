---
"@features/flow-pay-card-widget": minor
---

Add `useCardOnboardingStatus`, which works out where a cardholder is in onboarding.

- Five steps: account, card, funded wallet, card in the phone's wallet, first purchase.
- Answered by `getUser`, `getCardStatus` and the linked-wallet join; the phone wallet step from the device; the purchase step reads `false` until the transactions endpoint lands.
- Each step is an id and a flag. Copy and icons belong to whatever renders them.
- Mobile lists all five, desktop the four it can answer.
- `completedCount` comes with the steps.
- Optional `skip`, so a signed-out host holds the reads.

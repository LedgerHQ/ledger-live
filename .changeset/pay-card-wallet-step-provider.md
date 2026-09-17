---
"@features/flow-pay-card-widget": minor
"@domain/api-card-management": patch
"@devtools/bindings": patch
"live-mobile": patch
---

Answer the phone wallet onboarding step from the provider.

- Mobile reads `cardAddedToDigitalWallet` from the card status; the step was answered from the device alone.
- A tenant that does not answer for the flag still falls back to what the device remembers.
- The onboarding mock gained `cardAddedToDigitalWallet`, named after the provider's field, so the dev tool's wallet toggle drives the mocked endpoint where request mocking is on.

---
"@features/flow-pay-card-widget": minor
"@domain/api-card-management": patch
"@devtools/bindings": patch
"live-mobile": patch
---

Answer the phone wallet step from the provider alone.

- Mobile reads `cardAddedToDigitalWallet` from the card status for the onboarding step.
- The device answer is gone: `hasAddedCardToWallet`, its two actions and its selector leave the widget state. The Add-to-Wallet CTA now hides on the provider's answer, and the instructions scene re-asks the card status instead of recording a local yes.
- A tenant that does not send the flag leaves the step undone and keeps offering the CTA.
- The onboarding mock gained `cardAddedToDigitalWallet`, so the dev tool's wallet toggle drives the mocked endpoint and follows request mocking like every other step.

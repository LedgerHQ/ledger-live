---
"@features/flow-pay-card-widget": minor
"@devtools/bindings": patch
---

Drop the device-held answer for the phone wallet onboarding step.

- The card status is now the only source: `hasAddedCardToWallet`, its two actions and its selector are gone from the widget state, and a tenant that does not send the flag leaves the step undone.
- The onboarding dialog no longer writes it: pressing the step is inert, like every other step.
- The dev tool's wallet toggle is now MSW-backed like the other steps, so it needs request mocking on.

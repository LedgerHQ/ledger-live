---
"@domain/api-card-management": minor
"@features/flow-pay-card-widget": minor
"@devtools/pay-card": minor
"@devtools/bindings": minor
"live-mobile": patch
---

Show and drive the derived card onboarding status from the Card / Pay devtool.

- A "Card onboarding" screen: a `Stepper` for the count, every step by the id the app keys it on, and the derived answer printed raw so a step can be traced to the response behind it.
- Each step a request decides carries a toggle. It sets what that endpoint answers, so the step follows on the next read and holds until it is cleared. The phone wallet step is answered on the device; the purchase step is read-only while nothing answers it.
- An endpoint answers from the provider until its toggle is used, so one step can be held while the rest stay real, and "Use the real answers" hands them all back.
- `@domain/api-card-management/mock/card-onboarding-status` holds those answers and the responses that carry them; the mobile MSW handlers read it before falling back to what they answered before.
- Mocking is started by an env var, so without it the screen says so instead of offering a toggle that would set an answer nothing reads.
- The hook gains `refresh`, which re-asks all three sources: the screen asks on open and on demand.

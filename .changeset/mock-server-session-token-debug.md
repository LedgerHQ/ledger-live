---
"ledger-live-desktop": patch
---

Expose the DMK mock server session token on the renderer's `window.ledger` debug surface. An E2E run can now read the session the app provisioned and edit the emulated device while the app runs — swapping APDU mocks to hold it on a given onboarding step — instead of copying the token out of the developer top bar indicator.

---
"ledger-live-mobile-e2e-tests": patch
---

Make `CommonPage.successViewDetails()` fail on the app's error modal instead of waiting out its full
60s budget on a success screen that can no longer appear. The step is shared by every mobile
send/delegate/stake spec, and it waited on `validate-success-screen` with a bare `toBeVisible`. When
the signing job fails, the flow renders `GenericErrorView` in place of the success screen, so the
wait could only ever time out — and reported "success screen never appears", which hid the real
error and mis-attributed QAA-1540 for four nightlies.

The wait now passes `errorElementId: generic-error-modal`, the fail-fast option `waitForElement`
already offers and that `swap.page.ts` already uses, so the failure is raised within ~1s of the
error modal appearing and names it.

This does not make the underlying NEAR/Stax delegate failure less frequent — see QAA-1540 for the
30s `GeneralDmkError` it exposes.

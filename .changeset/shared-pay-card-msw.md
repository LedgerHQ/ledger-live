---
"@support/msw-features-flow-pay-card": minor
"@features/flow-pay-card-details": patch
---

Share the Pay Card MSW test store across card flows.

`@support/msw-features-flow-pay-card` holds the store, the signed-in and signed-out wrappers and the
MSW server that every Pay Card flow package needs to test a view model against the card API, so each
one no longer keeps its own copy. `pay-card-details` reads it from there now.

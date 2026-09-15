---
"@features/flow-pay-card-auth": minor
---

feat(pay-card): build every hosted Card URL in the flow

Adds `buildHostedUrl` and `buildHostedPageUrl`, and an optional `hostedUiUrl` on `CardLoginOauthConfig`, so a host app can address any hosted Card page without hardcoding its origin.

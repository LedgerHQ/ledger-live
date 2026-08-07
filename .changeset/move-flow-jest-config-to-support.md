---
"@features/flow-market-banner": minor
"@features/flow-pay-card-auth": minor
"@features/flow-contacts": minor
---

Take the shared flow jest configuration from `@support/jest-features-flow` instead of `@features/platform-jest-config`. The package moved to the `support/` layer, which is where development-only tooling belongs; its API is unchanged.

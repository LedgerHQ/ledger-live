---
"live-mobile": minor
---

Start the mobile app with an injected Card session for local development and E2E. `CARD_SESSION_BOOTSTRAP` takes a `PayCardSession` as JSON: Detox passes it as a launch argument, and Metro local reads `process.env` only in `__DEV__`. A Detox launch with no payload clears any leftover keychain session so a no-card run cannot inherit the previous one. Keeping it out of `@shared/env` and committed `.env` files keeps the bearer token out of `getAllEnvs()` and out of the shipped artifact. The app seeds `cardSession` and marks signed in when the build is development or launched with `DETOX`.

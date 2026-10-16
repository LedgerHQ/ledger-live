---
"@shared/app-config": minor
"@shared/auth": minor
"@shared/env": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/auth` drops the `authEnvironment` slice and `@shared/env` drops the `LEDGER_AUTH_*` definitions.

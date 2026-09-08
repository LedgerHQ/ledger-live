---
"@ledgerhq/live-env": minor
"@shared/env": patch
"@features/platform-env": patch
---

Mark the whole public API deprecated and ship the migration guide. `getEnv`, `setEnv`, `setEnvUnsafe`, `getEnvDefault`, `getAllEnvs`, `injectDefinitions`, `changes`, the registry introspection helpers, the exported types and the `useEnv` hook now carry `@deprecated`. `libs/env/MIGRATION.md` documents the four exits every variable takes; `shared/env/MIGRATION.md` covers what that means inside ledger-live. No behaviour change.

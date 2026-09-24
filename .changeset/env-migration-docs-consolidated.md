---
"@ledgerhq/live-env": patch
"@shared/env": patch
"@features/platform-env": patch
---

Point the deprecation notices at `docs/configuration.md`, which is now the single guide for where a configuration value belongs and how to take one out of the env registry. `libs/env/MIGRATION.md` and `shared/env/MIGRATION.md` are removed — their content lives there, next to the app `.env` and build-secret mechanics it was already linking to. Comments and docs only.

---
"@ledgerhq/live-env": major
---

Breaking: `getEnv()`, `setEnv()` and all env APIs now throw until `injectDefinitions()` is called.

Env var definitions (~200 vars) have been extracted from the package into the workspace-private `@shared/live-env` layer. Consumers that import directly from `@ledgerhq/live-env` must call `injectDefinitions(defs)` before any API call. Apps using `@shared/live-env` are unaffected (injection happens at module load).

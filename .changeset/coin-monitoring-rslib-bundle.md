---
"@ledgerhq/coin-modules-monitoring": patch
---

Bundle the monitoring CLI with rslib (like apps/cli) instead of running the bundler-targeted `lib-es` output under Node directly. Now that live-common is ESM-only, its `lib-es` is not natively runnable by Node (extensionless imports, esModuleInterop, `require()`, JSON imports); the bundler resolves all of that at build time, so the custom ESM loader is no longer needed.

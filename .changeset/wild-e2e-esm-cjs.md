---
"ledger-live-mobile-e2e-tests": patch
---

Fix mobile e2e jest loading of ESM-only live-common: transpile `lib-es` to CommonJS in the jest main process (config/globalSetup/reporters) via an swc require-hook, and transform `@ledgerhq` packages in jest workers (`ESM_PACKAGES` + babel `modules-commonjs`/`dynamic-import`). Resolves `ERR_MODULE_NOT_FOUND` on extensionless `device-core` imports after live-common became ESM-only.

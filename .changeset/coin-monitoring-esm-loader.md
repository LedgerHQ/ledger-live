---
"@ledgerhq/coin-modules-monitoring": patch
---

Run the monitoring CLI as native ESM and build ESM-only, so it can consume the now ESM-only live-common. Reworked the ESM loader to keep `@ledgerhq/*` resolved as ESM (single `LiveConfig` instance) while patching the bundler-targeted `lib-es` output: extensionless/directory/bare-subpath import resolution, `type: "json"` import attributes, a `require()` shim, and `esModuleInterop` emulation for third-party CommonJS deps.

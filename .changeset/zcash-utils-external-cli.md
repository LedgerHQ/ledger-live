---
"@ledgerhq/live-cli": patch
"@ledgerhq/coin-modules-monitoring": patch
---

Load `@ledgerhq/zcash-utils` at runtime instead of bundling it, so Node resolves the native binary for the host platform.

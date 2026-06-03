---
"@ledgerhq/live-common": patch
---

Drop the CommonJS build: live-common is now ESM-only (single `lib-es` output). Removed the `require` export conditions and the dual `tsc` pass. Consumers (desktop/mobile bundlers, jest, cli) resolve the ESM build via the `default` condition.

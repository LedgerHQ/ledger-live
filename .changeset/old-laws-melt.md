---
"@ledgerhq/live-common": patch
---

fix: remoteLiveApp hook not returning filtered manifest

This has an impact now that we return customized manifest when filtering we need to return this one in priority

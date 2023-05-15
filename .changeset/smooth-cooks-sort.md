---
"@ledgerhq/live-common": patch
---

Throttle the events coming from inline app installs. They were causing the UI to slow down as they weren't being properly throttled.

---
"@ledgerhq/live-dmk-desktop": patch
---

Stop the device screen poller from writing state after it is torn down, so a screenshot still in flight when the panel closes lands nowhere.

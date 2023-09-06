---
"@ledgerhq/live-common": patch
---

Fix: battery check command logic

The battery check command was updating and keeping (to a lower value) the unresponsive timeout due
to race conditions. It was creating incorrect locked device errors.

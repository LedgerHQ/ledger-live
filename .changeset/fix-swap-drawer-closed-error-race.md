---
"@ledgerhq/live-common": patch
---

Fix a race in the swap exchange flow where a stale/late cancel callback (e.g. a `DrawerClosedError`) could fire after the swap had already succeeded, causing the backend to receive both a swap accepted and a swap cancelled report for the same swap.

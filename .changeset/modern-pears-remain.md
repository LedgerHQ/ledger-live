---
"@ledgerhq/live-common": patch
"@ledgerhq/device-core": patch
---

chore(BACK-7633): switch app store API endpoints from POST to GET when applicable

This change will reduce load on the backend service and improve latency for clients.

Related:
 - https://github.com/LedgerHQ/nano-appstore/releases/tag/v1.7.0
 - https://github.com/LedgerHQ/tf-aws-production/pull/3546

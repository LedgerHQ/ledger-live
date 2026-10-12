---
"@ledgerhq/live-common": patch
---

Give each recipient of a multi-recipient Hedera transfer its own operation id in the generic bridge, and report a token sent to several recipients in one transaction as one token operation.

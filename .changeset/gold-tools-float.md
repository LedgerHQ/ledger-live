---
"@ledgerhq/live-common": patch
---

Keep the send flow's broadcast outcome when a background sync refreshes the account mid-broadcast, so the flow no longer stays on "Broadcasting transaction..." after the transaction is sent.

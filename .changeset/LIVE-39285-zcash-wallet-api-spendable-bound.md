---
"@ledgerhq/live-common": patch
---

zcash: with the shielded engine on, live apps are offered at most what one transaction can spend (the largest transparent UTXOs up to the device input limit), so a swap no longer fails with "too large to send in one transaction"

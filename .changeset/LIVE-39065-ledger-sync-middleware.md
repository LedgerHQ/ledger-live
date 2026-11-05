---
"@features/platform-wallet-sync": minor
"@shared/cloud-sync": minor
"@domain/entity-wallet-sync": minor
---

Add the Ledger Sync store middleware, which builds the LKRP SDK, the Cloud Sync SDK, the QR code pairing and the status fetchers once per store and runs the Wallet Sync watch loop. The Cloud Sync SDK rejects a concurrent call with `CloudSyncSDKLocked`, and the watch loop skips a poll that meets it. Its `saveNewUpdate` also gets the trustchain of the call, so the middleware drops an update that settles after a reset or a new pairing.

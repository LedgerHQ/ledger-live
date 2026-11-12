---
"ledger-live-desktop": minor
"live-mobile": minor
"@features/flow-receive": minor
"@features/flow-pay-request": minor
"@features/platform-intent-verify-address": minor
"@features/platform-device-intent": minor
"@shared/ui-info-state": minor
"@shared/feature-flags": minor
"@devtools/receive": minor
"@devtools/bindings": minor
"@devtools/registry": minor
"@domain/entity-account-receive": minor
"@ledgerhq/live-common": minor
---

Add the new receive flow behind `newReceiveFlow`, built on the `receive`, `accountStatus` and `assetStatus` account data kinds (POC); `receive` tells the memo a sender can attach to each address, from the coin's send descriptor

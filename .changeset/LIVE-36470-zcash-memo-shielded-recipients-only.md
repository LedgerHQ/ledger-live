---
"@ledgerhq/live-common": minor
"@ledgerhq/coin-zcash": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

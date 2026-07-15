---
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Add a TRON send-flow network-fees explanation (tooltip on desktop, drawer on mobile) describing whether staked energy and bandwidth cover the transfer or the fee is paid by burning TRX, via a new family-agnostic `getNetworkFeesInfo` send-descriptor accessor. Other currencies are unchanged.

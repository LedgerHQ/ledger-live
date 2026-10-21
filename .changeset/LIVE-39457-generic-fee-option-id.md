---
"@ledgerhq/live-common": patch
---

Build the Celo "Pay fees in" options from the coin-module's fee options (ids `standard` and the lowercased contract address) and forward a transaction's `feeOptionId` as `feeOption` to `estimateFees` in the generic bridge.

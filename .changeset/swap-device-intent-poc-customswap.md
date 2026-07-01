---
"@ledgerhq/wallet-api-exchange-module": minor
"@ledgerhq/live-common": minor
---

Add `customSwap` to the wallet-api exchange SDK and expose the matching `CustomSwapParams` / `CustomSwapResult` types (also re-exported from `@ledgerhq/live-common/wallet-api/Exchange/swapFlow/types`). This is the live-app entry point for the new device-intent-based swap flow on mobile, which currently runs the EVM token-approval step (sign on device, broadcast, wait for the receipt). Submit-swap and broadcast-swap will follow on the wallet side, reusing this same wire shape.

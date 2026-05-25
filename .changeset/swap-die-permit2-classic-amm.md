---
"@ledgerhq/live-common": minor
"live-mobile": minor
---

Add support for Permit2 + classic AMM swap quotes (Uniswap with
`permitData`, non-RFQ) in the wallet-side `custom.swap` device-intent
flow. A new cross-platform `signPermit2Evm` intent signs the EIP-712
typed-data payload via DMK's `signTypedData` device action, and the
shared `swapFlow` machine grows two new plan kinds (`permit-then-swap`
and `approval-then-permit-then-swap`) plus a `signPermit2` state that
threads the resulting signature into the DEX builder's
`buildContext.permitSignature`. The planner also skip-guards RFQ /
UniswapX / 1inch-Fusion quotes (`kind: "skip", reason:
"rfq-not-supported"`) so they fall back to the legacy live-app path
instead of silently mis-routing into a broken classic-swap call (Task 8
will widen this once the wallet-side RFQ submit/poll machinery lands),
and refuses to silently downgrade to a direct swap when a DEX quote
claims approval is required but ships no approval blob
(`reason: "dex-approval-blob-missing"`).

---
"@ledgerhq/live-common": minor
---

Add support for Permit2 + classic AMM swap quotes (Uniswap with
`permitData`, non-RFQ) and RFQ swap quotes (UniswapX, 1inch Fusion) in
the wallet-side `custom.swap` device-intent flow. A new cross-platform
`signPermit2Evm` intent signs the EIP-712 typed-data payload via DMK's
`signTypedData` device action, and the shared `swapFlow` machine grows
four new plan kinds (`permit-then-swap`, `approval-then-permit-then-swap`,
`rfq-order`, `approval-then-rfq-order`) plus the matching `signPermit2`,
`signRfqOrder`, and `submitRfqOrder` states. The Permit2 path threads the
resulting signature into the DEX builder's `buildContext.permitSignature`;
the RFQ path signs an off-chain EIP-712 order then submits and polls it
against the partner's swap-api endpoints. The planner refuses to silently
downgrade to a direct swap when a DEX quote claims approval is required
but ships no approval blob (`reason: "dex-approval-blob-missing"`),
skip-guards RFQ quotes that are missing the EIP-712 payload we need to
sign (`reason: "rfq-typed-data-missing"`), and surfaces the
USDT-on-Ethereum revoke edge case as `reason: "usdt-revoke-needed"` so
hosts can fall back to the legacy swap pipeline for that flow.

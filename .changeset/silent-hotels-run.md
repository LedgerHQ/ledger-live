---
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-api-exchange-module": minor
---

Normalize additional Swap quote fields inside the Wallet API

- Normalize `payoutNetworkFees` and `tokenAllowance` to the wallet schema (remapping `currency` → `currencyId`, preserving deep structure).
- Expose raw `tags` (`isRegistrationRequired`, `isTokenApprovalRequired`) on `QuoteDetails` so KYC and token-approval gating is driven by the normalized shape.
- Hoist the legacy `customFields` permit bag into a single optional `permitData` envelope, preferring `customFields.permitData` (UniswapX) over `customFields.quoteResponse.typedData` (1inch-fusion) and carrying `orderHash`, `priceRoute`, and `providerTag` alongside.
- Drop quotes for an unsupported-pair blocklist (currently `near <-> stellar`, direction-agnostic) inside `getQuotes`; aggregator errors for the same pair still flow through.

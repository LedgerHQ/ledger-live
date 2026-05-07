---
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-api-exchange-module": minor
---

Wallet-side Swap quotes: emit network-fee estimate on each quote

- Add `QuoteDetails.estimatedNetworkFee` and the new `QuoteDetails.approvalNetworkFee` (shaped identically) so consumers can display a split breakdown ("Network: X, Token approval: Y") or sum the two for a total cost. `approvalNetworkFee` is only emitted when a pre-swap ERC-20 approval is required.
- `custom.exchange.getQuotes` now computes fees wallet-side: one upfront bridge call per invocation gathers default-strategy gas parameters and the fee-paying account balance, then each quote is normalized against that context. EVM uses `maxFeePerGas`/`gasPrice` × `gasLimit` (+`APPROVAL_GAS_LIMIT` when needed); non-EVM chains fall back to the bridge-reported estimate; Solana uses a hardcoded 0.003 SOL override.
- Start emitting `QuoteError = "notEnoughBalanceForFees"` per quote when the fee-paying account balance can't cover `estimatedNetworkFee + approvalNetworkFee`, gated on the quote actually having an on-chain cost (non-zero `networkFees.value` or `isTokenApprovalRequired`).

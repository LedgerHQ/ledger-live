---
"live-mobile": patch
---

Fix set custom fees in evm flow

When updating the fees in custom mode for an EVM transaction, clicking on the "Valide Fees" CTA would't do anything (expected behaviour would be to return the fee strategy selection screen with new custom entry selected).
Fixes this and returns to fee strategy selection screen with the new custom entry selected.
PS: for the swap flow, updating the transaction will redirect to the swap summary screen, which is the expected behaviour as of today

---
"@ledgerhq/coin-aleo": minor
"@ledgerhq/coin-tester-aleo": minor
---

Add the Aleo end-to-end coin-tester, and fix the send-max validation, outgoing operation values and token transfer parent operations it covers.

- Run public, private, send-max and token transfer scenarios on a pinned devnode image.
- Validate a private transfer against its own records only.
- Report `NotEnoughBalance` for a public send-max when the balance only covers the fee.
- Include the fee in the value of outgoing native operations, so the optimistic and confirmed operations match the balance change. Operations synced before this change keep their fee-exclusive value until the account is synced from scratch.
- Match token transfer operations by transaction hash, so each transaction has one parent operation.
- Promote the parent of an outgoing or self token transfer to `FEES`, and report the fee only on the outgoing token operation.
- Emit both an outgoing and an incoming token operation for a token self-transfer.
- Clear the amount, senders and recipients on an incoming token transfer's parent, and keep `extra.programId`.

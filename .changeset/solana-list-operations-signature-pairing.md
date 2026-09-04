---
"@ledgerhq/coin-solana": minor
---

fix(coin-solana): pair each signature with its own parsed transaction in listOperations

JSON-RPC batch responses are not order-guaranteed, so pairing the signature list with the parsed
transaction batch by array position could attach another transaction's fee, feesPayer and balances
to a signature. Transactions are now matched by their own signature.

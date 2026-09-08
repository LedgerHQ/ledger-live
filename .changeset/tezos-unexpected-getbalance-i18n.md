---
"ledger-live-desktop": patch
"live-mobile": patch
---

Add an error message for `UnexpectedGetBalanceError`

`@ledgerhq/coin-tezos` reports this error when a token balance cannot be retrieved, so Send Max
no longer claims the account has insufficient funds during an indexer outage. Without a
translation the send flow fell back to rendering the raw error name.

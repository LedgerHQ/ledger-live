---
"@ledgerhq/coin-zcash": patch
"ledger-live-desktop": patch
---

Exclude immature Ironwood notes from the spendable pool. A shielded note is only spendable once its transaction is buried deep enough to have a witness at the builder's anchor, so a freshly scanned change note is no longer selected while a second send is prepared within the same confirmation window. The rule is applied wherever the spendable pool is derived — note selection, max-spendable and amount validation — and the send flow now reports insufficient spendable funds instead of failing when the transaction is built. Funds held by maturing notes stay part of the account's total balance.

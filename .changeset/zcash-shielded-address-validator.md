---
"@ledgerhq/coin-bitcoin": patch
"ledger-live-desktop": patch
---

zcash: add ZIP-316 Unified Address classifier and shielded recipient validation

Implements ZIP-316 UA typecode inspection (F4Jumble inverse + compact-size receiver
walk) in coin-bitcoin. Adds classifyZcashRecipient, deriveZcashTransferType, and
ZcashSaplingRecipientNotSupported error. Extends updateTransaction and
getTransactionStatus to derive recipientType/transferType in the shielded-context
send flow (gated on the sender field set by UI-01). Adds a Zcash-gated recipient
feedback alert to the bitcoin SendRecipientFields family slot in LLD.

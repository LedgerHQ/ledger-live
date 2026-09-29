---
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Show a matched Me contact as "<name> (Me)" in Send: the recipient card, the "Address matched" row, the amount step "To" header, the Pay success title and the History counterparty. `MatchedContact` and `RecipientHeaderContact` now carry `isMe`, and `RecipientHeaderPresentation.label` is renamed `recipientDisplayValue` and never holds a contact name.

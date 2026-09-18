---
"live-mobile": patch
---

Price the card wallets in the Pay tab's Assets list.

- Resolves the card's currencies and prices each wallet against the user's counter value.
- Registers those pairs for the session, since no account holds a card wallet's currency.
- Both are gated on the card being signed in, so a visitor who never opens it is charged neither.

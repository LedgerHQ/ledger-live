---
"ledger-live-desktop": patch
---

Show what each card wallet is worth in the right-panel card.

- Resolves the card's currencies and prices each wallet against the user's counter value.
- Registers the pairs through the existing on-demand tracking helper, since no account holds them.
- Both are gated on the card being signed in.

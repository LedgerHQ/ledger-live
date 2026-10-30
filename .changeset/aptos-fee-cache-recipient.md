---
"@ledgerhq/coin-aptos": minor
---

fix(coin-aptos): key the fee estimation cache on the recipient

The cached estimate was reused across recipients for the same amount, so switching to a recipient
that needs a new primary store could sign with a gas limit that is too low.

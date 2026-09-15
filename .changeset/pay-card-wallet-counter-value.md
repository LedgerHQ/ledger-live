---
"@features/flow-pay-card-wallets": minor
"live-mobile": patch
---

Price a card-linked wallet in the user's counter-value currency.

- `ResolveWalletCounterValue` takes the wallet's `ledgerId`, not the provider's ticker.
- Coins resolve from the crypto registry, tokens from CAL.
- An unmapped asset, or a balance the parser cannot read, reads as unpriced rather than as zero.
- Card assets register as counter-value tracking pairs, deduped by `pairId`.

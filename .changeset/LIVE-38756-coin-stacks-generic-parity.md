---
"@ledgerhq/coin-stacks": minor
---

fix(coin-stacks): align the CoinModuleApi with the classic bridge ahead of the generic-adapter switch

- `listOperations` resolves a SIP-010 transfer's token from the contract's FT metadata when the transfer has no Fungible post-condition, and canonicalizes it against the token registry, so these transfers are no longer dropped from history.
- `estimateFees` builds a zero-amount sweep instead of throwing, so the max spendable of an empty account can be estimated; crafting such a sweep still throws.
- The transaction serializer accepts a generic-bridge transaction (no `network`/`anchorMode`) and round-trips its `assetReference`/`assetOwner`.

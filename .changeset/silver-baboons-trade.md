---
"@ledgerhq/live-common": minor
---

Drop the staking amount clamp in transactionToIntent so coin modules can receive the user-typed transaction amount for stake/unstake/finalize_unstake intents.
Previously the framework forced amount=0n and useAllAmount=true for any staking intent, which prevented partial-amount staking for tezos. EVM/XRP/Stellar never produce these intent types, so they are unaffected.

Also log rejections from `loadAccountDelegation` in `useDelegation` instead of silently swallowing them, so failed delegation fetches are observable.

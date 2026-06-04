---
"@ledgerhq/coin-tezos": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": patch
---

Fix Tezos transaction validation to gate on the spendable (liquid) balance instead of the total balance. Delegate, undelegate, send, stake, unstake, and finalize now correctly block when staked or unstaked-frozen funds leave too little liquid XTZ to cover fees, instead of passing client-side and failing at broadcast. Also consolidate `useTezosStakingInfo`'s available balance onto the single source of truth (`account.spendableBalance`). On desktop, the staking flow's validator step now blocks before signing the initial delegation when the spendable balance can't cover the delegation fee, instead of letting it broadcast and fail. The displayed spendable/delegated balance now derives the unstaked-frozen total from the account-level field (the same source as the validation gate), so a failed `unstake_requests` fetch no longer transiently overstates spendable. The staking flow's "Use Max" / maximum-spendable amount now also excludes unstaked-frozen funds (not stakeable until finalized), matching the validation gate — previously it overstated the stakeable amount and produced an unsendable value.

Also on desktop: show the staking and unstaking panels before the delegation panel; show the staked principal instead of the fee for stake, unstake, and finalize operations in the operations list and details drawer; and reword the stake insufficient-funds error to reference the balance instead of delegation.

---
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-common": patch
"ledger-live-desktop": minor
"live-mobile": minor
---

Support Monad compound (restake rewards): add the per-chain `compoundReward` staking operation to coin-evm (native `compound(uint64)` precompile call, nonpayable) and a Claim/Compound toggle in the EVM claim-rewards flow on desktop and mobile. The toggle is only shown for compound-capable chains (Monad) and defaults to Claim; the history operation type is `REWARD`, matching the existing claim flow.

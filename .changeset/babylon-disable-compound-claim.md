---
"@ledgerhq/coin-cosmos": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Hide the "Compound" claim-rewards option for Cosmos-family chains that use epoching (wrapped) staking messages, such as Babylon. Compound restaking is not supported on those chains yet — its embedded delegate is not epoching-wrapped — so only "Cash in" (claim rewards) is offered, preventing the "claimRewardCompound is not supported" error.

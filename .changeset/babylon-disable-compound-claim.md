---
"@ledgerhq/coin-cosmos": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Hide the "Compound" claim-rewards option for Cosmos-family chains that use epoching (wrapped) staking messages, such as Babylon. Compound restaking is not supported on those chains yet — its embedded delegate is not epoching-wrapped — so only "Cash in" (claim rewards) is offered, preventing the "claimRewardCompound is not supported" error.

---
"ledger-live-desktop": minor
"@ledgerhq/coin-evm": minor
---

Fetch pending staking rewards for Cosmos-EVM hybrid chains (Sei) via the Cosmos distribution REST endpoint so `Stake.amountRewarded` is populated, and wire the per-row "Claim rewards" action on desktop so it opens the claim flow pre-selected on the chosen validator.

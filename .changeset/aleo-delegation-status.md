---
"@ledgerhq/coin-aleo": minor
"@ledgerhq/live-common": minor
"live-mobile": minor
---

Show the Aleo delegation status on the mobile account page: the available balance next to the transparent/private breakdown, the staked, unstaking and claimable totals, the bonded validator with its address, explorer link and estimated rate, why a position earns nothing, and the unbonding countdown down to the block. The section offers an empty state with a call to action, a Stake account action, a manage drawer with Unstake and Claim, and turns the countdown into a Claim button once the funds are claimable — all gated behind the enableStaking config flag.

---
"ledger-live-desktop": minor
"@ledgerhq/coin-stacks": minor
"@ledgerhq/live-common": minor
---

feat(stacks): add desktop stake and unstake flows

coin-stacks: `spendableBalance` now excludes locked (staked) STX for every Stacks account, matching `getBalance`, which lowers the Send max for accounts with a stake.

coin-stacks: `validateIntent` rejects a stake during the pox-5 prepare phase (`StacksStakeInPreparePhase`), which the chain would abort while still charging the fee.

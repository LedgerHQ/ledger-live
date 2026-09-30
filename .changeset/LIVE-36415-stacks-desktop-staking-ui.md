---
"ledger-live-desktop": minor
"@ledgerhq/coin-stacks": patch
"@ledgerhq/live-common": patch
---

feat(stacks): add desktop stake and unstake flows

coin-stacks: `spendableBalance` now excludes locked (staked) STX for every Stacks account, matching `getBalance`, which lowers the Send max for accounts with a stake.

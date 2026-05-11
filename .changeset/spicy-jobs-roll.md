---
"@ledgerhq/live-common": minor
---

Add `useTezosStakingInfo(account)` React hook (`families/tezos/react`) — a derived view over `account.stakingPositions[]` that exposes the four Paris-upgrade positions as flags + `BigNumber` amounts (`isDelegated`, `isStaked`, `hasUnstaking`, `stakedBalance`, `unstakedBalance`, `unstakedFinalizable`, `availableBalance`, `delegateAddress`) plus the existing rich `Delegation` from `useDelegation`. Positions are matched by uid prefix (`delegation-*` / `stake-*` / `unstaking-*` / `finalizable-*`); non-Tezos and token accounts fall back to zero/false defaults.

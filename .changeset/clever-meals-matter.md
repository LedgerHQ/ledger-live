---
"@ledgerhq/coin-tezos": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
---

feat(tezos): per-request unstaking positions with dates, surfaced through useTezosStakingInfo.unstakingPositions; LWD account page gains Staking + Unstaking sections (with 4-day countdown) and a unified Earn entry point that opens the delegate/stake choice modal, all gated by lldTezosStaking. Also unblocks the dashboard for Paris-upgrade accounts that lack tezosResources, propagates TzKT unstake endpoint errors instead of dropping unstaking positions silently, and makes TezosAccount.stakingPositions and TezosAccountRaw.tezosResources optional to match runtime shape (LIVE-29544)

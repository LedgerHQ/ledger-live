---
"@ledgerhq/coin-tezos": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
---

feat(tezos): per-request unstaking positions with dates, surfaced through useTezosStakingInfo.unstakingPositions; LWD account page gains Staking + Unstaking sections (with 4-day countdown) and a unified Earn entry point that opens the delegate/stake choice modal, all gated by lldTezosStaking. Also unblocks the dashboard for Paris-upgrade accounts that lack tezosResources, propagates TzKT unstake endpoint errors instead of dropping unstaking positions silently, and makes TezosAccount.stakingPositions and TezosAccountRaw.tezosResources optional to match runtime shape (LIVE-29544). LWD stake-flow modal switches to the shared AmountField (Switch toggle for max, matching Solana/Cosmos), skips AmountRequired in validateStakeConstraints when useAllAmount is true so the bridge can resolve the stake max, gates StepDeviceDelegation/StepDeviceStaking on transaction.fees to avoid FeeNotLoaded after Continue, and suppresses bridge errors while the new delegation propagates so the first step doesn't flash red.

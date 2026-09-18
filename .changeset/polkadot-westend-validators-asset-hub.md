---
"@ledgerhq/coin-polkadot": patch
"@ledgerhq/live-common": patch
---

Fix `getValidators` returning an empty list on Westend

Westend's staking pallet has fully migrated off the relay chain onto its Asset Hub, so the
relay-chain node no longer exposes `api.query.staking` and `fetchValidators` bailed out early with
an empty array. Staking-pallet storage reads (`activeEra`, stashes, commissions, exposure) are now
redirected to a dedicated Asset Hub node (`assetHub.nodeUrl`) when configured, while the
currently-elected validator set keeps reading `session.validators()` from the currency's own node,
since an Asset Hub's session validators are its own collator set, not the real staking-elected
validators. `fetchStakingInfo`'s "staking pallet missing" guard is now generic (based on
`historicApi.query.staking` being absent) instead of being hardcoded to `assethub_polkadot`.

---
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
---

Display a user's active Monad staking delegations and hide the unsupported "Redelegate" action.

- **coin-evm**: add a bespoke `fetchMonadStakes` fetcher that enumerates the delegator's validators via the paginated `getDelegations(delegator, startValId)` precompile, reads each position with `getDelegator` (`amount = stake + deltaStake + nextDeltaStake`, so freshly delegated MON stays visible during the activation epoch), and resolves the validator display address via `getValidator`. Add a `hasRedelegation(currencyId)` helper (true only when the chain exposes a `redelegate` precompile).
- **live-common**: thread the delegation's `validatorId` (from `Stake.details`) onto `StakingDelegation` to feed the upcoming undelegate/withdraw flows; re-export `hasRedelegation`.
- **ledger-live-desktop**: omit the "Redelegate" item from the delegation row menu on chains without a `redelegate` precompile (e.g. Monad) instead of showing it disabled with a misleading tooltip.

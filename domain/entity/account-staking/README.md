# @domain/entity-account-staking

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `staking` kind: the staking positions of an account, one per delegation, stake or unbonding, read only.

## Scope

- **Answers** what the account has staked, per position: its asset, validator, state, amount, rewards, unlock date and the actions it allows.
- **Read by** the staking summaries of an account (the Cosmos balance footer first) through the totals selectors.
- **Out of scope**: validators and their APY (network data, keyed by network), staking writes (the `send` capability), the reward history, and the spendable balance (`balance`).

## Model

Modelled on the coin module `Stake` (`@ledgerhq/coin-module-framework`), amounts as integer strings in the asset's smallest unit.

- `staking`, no query, `{ positions: AccountStakingPosition[], rewards? }`, `positions` empty for an account that does not stake:
  - `id`, unique among the positions of the account; `assetId`; `validatorId`, the validator or delegate address, if any; `validatorIds` instead when one stake backs several validators (Polkadot nominations).
  - `state`: `inactive`, `activating`, `active`, `deactivating` (unbonding until `unlockAt`) or `withdrawable`.
  - `amount`; `rewards`, part of `amount` when the chain compounds them, to claim apart otherwise (Cosmos); `deposited`; `votes`, the vote count where the chain counts votes apart from `amount` (Tron).
  - `actions`, absent when the source does not tell.
  - `redelegatingFrom`, `{ validatorId, completesAt? }`, set on the delegation a pending redelegation moved stake to: Cosmos refuses another redelegation from that validator until `completesAt`. A redelegation is not a position of its own, its stake is already counted in the destination's delegation. When several are pending to one destination, it keeps the one completing last, the date the delegation can be redelegated again.
- `rewards`, `{ assetId, amount }[]`, the rewards claimable account-wide, earned by no one position (Tron); absent when every reward rides on its position.
- Totals are not stored. `stakingTotals(staking)` and the selectors give per asset `staked` (active and activating), `unbonding` (deactivating), `withdrawable` and `rewards` (the positions' plus the account-wide ones):
  - `selectAccountStakingPositions(state, accountUUID)`;
  - `selectAccountStakingTotals(state, accountUUID)`, one row per asset with a position or reward;
  - `selectAccountAssetStakingTotals(state, accountUUID, assetId)`, zero for an asset with neither position nor reward.
- Each selector is `undefined` until the account is read. The slice keys each `AccountUUID` to its last answer with its revision, the older answer never replacing the newer. Apps mount it at `accountStaking`.

## Sources

| Source | Covers |
| --- | --- |
| FullSync | `stakingResources` (Cosmos family, Solana, Hedera, EVM staking chains, Aleo): delegations, with their pending redelegation, and unbondings; `stakingPositions` (Tezos, NEAR, Stacks, Celo); family resources through `loadStaking` (Tron, Polkadot) |
| CoinModule | `getStakes` of the families the source serves, Cosmos first |
| Mock | a delegation and an unbonding for a staking family, none otherwise |

Family resources, mapped by `families/<family>/staking.ts` in live-common:

- **Tron** votes with TRON POWER, one per frozen TRX. Each vote is an `active` position on its super representative whose `amount` is the voted power in sun (`voteCount × 10^6`) and `votes` the count. Frozen TRX backing no vote is one `inactive` position without validator. Each unfreezing entry is `deactivating` until its expiry, `withdrawable` after. The reward is account-wide, not per vote: it is in the account-level `rewards`.
- **Polkadot** nominates: the whole bond backs whichever nominated validator is elected. The bond is one position, its `amount` the active stake and `validatorIds` the nominees, `active` while one of them is elected, `inactive` otherwise. Each unlocking chunk is `deactivating` until its date, `withdrawable` after. Rewards are paid out, so no position carries any.

These positions and the `locked` of `balance` describe the same TRX or DOT from two angles: the balance tells why it is not spendable (frozen, staked, unbonding), staking tells where it is put to work. Never add one to the other.

Not mapped yet: staking held in other family resources (MultiversX, Sui, Cardano, Aptos, Tezos `tezosResources` delegation…). These families answer no position until their mapping lands.

Not a fetch status: pending, the last error and the source stay in `accountData`. See [the account data layer](../../../docs/account-models/data-layer.md).

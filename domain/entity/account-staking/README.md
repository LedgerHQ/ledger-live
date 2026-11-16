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

- `staking`, no query, `{ positions: AccountStakingPosition[] }`, empty for an account that does not stake:
  - `id`, unique among the positions of the account; `assetId`; `validatorId`, the validator or delegate address, if any.
  - `state`: `inactive`, `activating`, `active`, `deactivating` (unbonding until `unlockAt`) or `withdrawable`.
  - `amount`; `rewards`, part of `amount` when the chain compounds them, to claim apart otherwise (Cosmos); `deposited`.
  - `actions`, absent when the source does not tell.
- Totals are not stored. `stakingTotals(positions)` and the selectors give per asset `staked` (active and activating), `unbonding` (deactivating), `withdrawable` and `rewards`:
  - `selectAccountStakingPositions(state, accountUUID)`;
  - `selectAccountStakingTotals(state, accountUUID)`, one row per staked asset;
  - `selectAccountAssetStakingTotals(state, accountUUID, assetId)`, zero for an asset without position.
- Each selector is `undefined` until the account is read. The slice keys each `AccountUUID` to its last answer with its revision, the older answer never replacing the newer. Apps mount it at `accountStaking`.

## Sources

| Source | Covers |
| --- | --- |
| FullSync | `stakingResources` (Cosmos family, Solana, Hedera, EVM staking chains, Aleo): delegations, unbondings, redelegations; `stakingPositions` (Tezos, NEAR, Stacks, Celo) |
| CoinModule | `getStakes` of the families the source serves, Cosmos first |
| Mock | a delegation and an unbonding for a staking family, none otherwise |

Not mapped yet: staking held in family resources (Tron votes and frozen balances, Polkadot, MultiversX, Sui, Cardano, Aptos, Tezos `tezosResources` delegation…). These families answer no position until their mapping lands.

Not a fetch status: pending, the last error and the source stay in `accountData`. See [the account data layer](../../../docs/account-models/data-layer.md).

# Celo staking — CoinModuleApi scoping note

**Status:** not implemented in this `api/` version. `getStakes`, `getRewards`, and
`getValidators` throw `"not supported"`, and the `stakingSupported` flag is stripped from the
delegated coin-evm api (see `index.ts`). This note records *what a Celo staking surface would
be*, whether Celo's model fits the framework, and what is still undetermined. It is input for a
future iteration, not a design commitment.

## What the CoinModuleApi staking surface looks like

The framework (`@ledgerhq/coin-module-framework/api`) models staking with:

- **`getStakes(address, cursor?) → Page<Stake>`** — `Stake { uid, address, delegate?, state, actions[],
  asset, amount, amountDeposited?, amountRewarded?, … }`, where `state ∈ {inactive, activating, active,
  deactivating, withdrawable}` and `actions ⊆ {delegate, redelegate, undelegate, claim_reward, withdraw}`.
- **`getRewards(address, cursor?) → Page<Reward>`** — discrete reward events `{ stake, asset, amount, receivedAt, … }`.
- **`getValidators(cursor?) → Page<Validator>`** — `{ address, name, balance?, commissionRate?, apy?, … }`.
- **A staking `TransactionIntent`** — `intentType: "staking"`, `mode: StakingOperation`, `valAddress`,
  `dstValAddress?`, where `StakingOperation ∈ {delegate, undelegate, redelegate, claimReward, compoundReward, withdraw}`.
  `craftTransaction`/`estimateFees`/`validateIntent` would extend to handle these.

This is a **delegate-to-a-validator** model with a single staking action per intent.

## Celo's staking model

Celo staking is a multi-step, multi-contract choreography (the legacy bridge already implements
the transaction builders — see `../bridge/buildTransaction.ts:118-247` and the on-chain reads in
`../network/sdk.ts:65-204`):

1. **register** — `Accounts.createAccount()` (one-time prerequisite before any locking).
2. **lock** — `LockedGold.lock()` moves CELO into locked gold (non-voting locked balance).
3. **vote** — `Election.vote(group, amount, lesser, greater)` directs locked CELO at a **validator group**.
4. **activate** — `Election.activate(group)` promotes *pending* votes to *active* (a required second step;
   typically after one epoch).
5. **revoke** — `Election.revokePending()` / `revokeActive()` (the choice depends on the vote's state).
6. **unlock** — `LockedGold.unlock(amount)` starts an unbonding period.
7. **withdraw** — `LockedGold.withdraw(index)` after the unbonding period, against a specific pending-withdrawal index.

Account staking state (`CeloResources` in `../types/types.ts`): `registrationStatus`, `lockedBalance`,
`nonvotingLockedBalance`, `pendingWithdrawals[]`, and `votes[]` (`{ validatorGroup, amount, activatable,
revokable, type: "pending" | "active", index }`).

> **Two competing models.** coin-evm also defines a Celo EVM-staking contract
> (`coin-evm/src/staking/contracts.ts` → `STAKING_CONTRACTS.celo`) with its own validator/delegation
> fetchers. So there are two candidate sources of truth for "Celo staking": the legacy bridge
> lock/vote/group model above, and coin-evm's generic EVM-staking-contract model. Which one the
> CoinModuleApi should expose is itself undetermined (see below).

## Fit assessment — partial

Maps acceptably:
- **`getStakes`** ≈ `getVotes()` (`../network/sdk.ts:106-183`): each `vote` → a `Stake` with
  `delegate = validatorGroup`, `amountDeposited = vote.amount`, and `state` derived from
  `pending`/`active`/`activatable`.
- **`getValidators`** ≈ Celo validator **groups** (preload data / `Election`), modulo the groups-vs-validators
  semantic gap.
- **`listOperations`** can already classify lock/unlock/vote/revoke ops (the bridge does, via
  `../bridge/synchronisation.ts`).

Maps poorly / does not map:
- **Single-intent `craftTransaction`** vs Celo's 7-step choreography (`register → lock → vote → activate`).
  A generic `delegate` intent has no clean expansion; `register`, `activate`, and "lock-without-vote" have
  no `StakingOperation` equivalent.
- **`getRewards`** — Celo rewards are distributed in-protocol per epoch (no discrete on-chain transfer event
  per reward), so `Reward[]` would have to be synthesized from epoch/indexer data not currently fetched.
- **Unbonding + indexed withdrawals** — `withdraw(index)` is index-addressed; the framework `withdraw` mode
  carries no index. The unbonding period also has no first-class representation beyond `state: deactivating`.
- **`revoke`** — choosing `revokePending` vs `revokeActive` depends on per-vote state not expressed by a plain
  `undelegate` intent.

## Undetermined (must be resolved before implementing)

1. **Which model** the api exposes: the legacy bridge lock/vote/group model, or coin-evm's `STAKING_CONTRACTS.celo`.
2. Collapsing `lock` / `vote` / `activate` into a single `delegate` intent (and whether the api auto-orchestrates the steps or surfaces them).
3. Representing `register` (account-creation prerequisite) — no `StakingOperation` mode covers it.
4. `withdraw(index)` ↔ index-less framework `withdraw`, and how `pendingWithdrawals` map to `Stake.state`/`actions`.
5. `revokePending` vs `revokeActive` selection under a single `undelegate` mode.
6. Reward modeling: synthesize `Reward[]` from epoch/indexer data, or report rewards only as `amountRewarded` in `getStakes`.
7. `getValidators` returning validator **groups** vs individual validators.
8. Whether staking transactions also support CIP-64 fee currencies (the bridge wires `feeCurrency`, but staking + fee-abstraction is untested).
9. No Celo analog for the framework's `compoundReward` mode.

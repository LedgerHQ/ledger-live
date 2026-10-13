# ADR: Remove `useAllAmount`, "Send Max" sets the amount directly

| | |
|---|---|
| **Status** | Proposed |
| **Date** | 2026-10-12 |
| **Author** | Quentin Perrot-Minnot |
| **Scope** | ledger-live-common (generic coin framework, bridges, send flows), coin modules, `@ledgerhq/coin-module-framework`, Desktop & Mobile send and staking flows, CLI, analytics |
| **Repos** | `LedgerHQ/ledger-live` (develop) and `LedgerHQ/coin-modules` (main @ `0e85380e`) |
| **Related** | coin-modules ADR-047 (`TransactionIntent` fields), ADR-060 (`balance.locked`, Stellar send-max double-count) |

---

## 1. Context

When the user clicks **Max**, the app sends:

```ts
bridge.updateTransaction(tx, { useAllAmount: true, amount: new BigNumber(0) })
```

The real amount is then computed **by the coin**, often in several places (`prepareTransaction`, `getTransactionStatus`, craft, sign, and for coin-module-framework coins `estimateFees` / `validateIntent`). The UI then shows `status.amount` instead of `transaction.amount`.

This causes four problems:

1. **The max is computed in several places per coin**, sometimes with different code. `estimateMaxSpendable` can disagree with what is actually signed.
2. **`transaction.amount` lies.** It is 0 while the user sends everything, so every consumer (amount input, fiat, coin control, custom fees, analytics…) needs a `useAllAmount ? status.amount : amount` branch.
3. **The flag has several meanings.** "Compute the amount for me", but also, on some coins, "build a sweep transaction" (Polkadot `transferAll`, TON carry-all, NEAR `unstake_all`…) or "skip a validation". It cannot be removed naively.
4. **Max is the only exception.** The 25/50/75% presets, the Wallet API (`getMaxSpendable`) and the sponsored-fee snap already set a concrete amount.

Footprint: about 1,845 occurrences, in all 27 coin modules, ~58 Desktop files and ~50 Mobile files. `TransactionIntent.useAllAmount` is declared in `@ledgerhq/coin-module-framework` (`src/api/types.ts:372`).

---

## 2. Decision

> **The amount is always concrete.** Ledger Live computes the max with `estimateMaxSpendable`, writes it into `transaction.amount`, and the coin only **validates** it. "Max" is a UI mode, not a transaction field.

### 2.1 Principle: Ledger Live builds the max from what the API already exposes

Ledger Live consumes the coin service. It does **not** need the service to export a max function if Ledger Live can compute the max from existing functions. For coin-module-framework coins, it can, with `getBalance`, `getStakes` and `estimateFees`:

```
start  = mode is undelegate/unstake ? staked position (getStakes / Balance.stake)
                                    : getBalance().value − locked − pending outgoing ops
fees   = estimateFees(intent with amount = start)
max    = start − max(fees.value + additionalFees, parameters.reserve)
         floored to parameters.amountScale
```

This is already what `genericEstimateMaxSpendable` / `computeUseAllAmount` do (`generic-coin-framework/estimateMaxSpendable.ts`, `utils.ts:448-462`), except for the staking start point.

**So no new API method is added.** The framework only gets one documented rule:

> **`estimateFees` contract:** when sending the whole balance needs more than `value` (+ `additionalFees`), the coin **always** returns `parameters.reserve` (the total that must stay out of the max) and, if needed, `parameters.amountScale`. These values must not depend on any flag. Normal sends ignore them.

Where a coin cannot express its max this way, we will reconsider a dedicated method. Today no coin needs one (Appendix A).

### 2.2 Sweep semantics become explicit coin fields

When the flag changes **what is signed** (not just the amount), it is replaced by an explicit, coin-specific field that the family UI sets. Examples: Polkadot `transferMode: "all"`, TON `sendMode: "carryAll"`, NEAR unstake-all, Sui full unstake, Cardano `sweep`, Solana Token-2022 `amountIncludesFee`. These fields **never** mean "compute the amount for me": `amount` is still filled with the max for display and validation. Where only a label or a validation changes, the coin can simply check `amount == max` (Appendix B).

### 2.3 What each layer does after the change

| Layer | Responsibility |
|---|---|
| UI (send + staking flows) | Holds `isMaxActive`. On Max, sets `amount = estimateMaxSpendable(tx)`. While active, recomputes on fee, fee strategy, balance, recipient, coin control, balance pool or mode change. Reads `transaction.amount` everywhere |
| `estimateMaxSpendable` (Ledger Live) | Only place that computes the max. Uses the transaction's fees, mode, recipient and coin control when given. Works **without** a transaction (Wallet API, `converters.ts:182`). Subtracts pending outgoing operations |
| `prepareTransaction` | Fees only. Never touches `amount` |
| `getTransactionStatus` / `validateIntent` | `status.amount = transaction.amount`. Validates `amount + fees (+ reserve) <= spendable` (`NotEnoughBalance`, `AmountRequired`) |
| Craft / sign | Use `transaction.amount` as is. No balance re-fetch, no recompute |

### 2.4 Options considered

| Option | Verdict |
|---|---|
| A. Status quo | ❌ Duplication and "amount lies" remain |
| B. Set the amount **and** keep the flag as a hint | ❌ Two sources of truth; the module overwrites the UI amount |
| **C. Concrete amount, max computed by Ledger Live from the existing API, sweep explicit per coin** | ✅ This ADR |
| D. Same as C, plus a new `estimateMaxAmount` method on `CoinModuleApi` | ❌ for now: every gap found can be closed by returning `reserve` unconditionally. Kept as a fallback if a coin cannot |
| E. Drop the flag including sweep semantics | ❌ Changes on-chain behaviour (Polkadot can't be emptied, NEAR/Sui/Aptos staking leaves dust, TON leftovers) |

---

## 3. Work required

### 3.1 coin-module-framework and coin packages (`LedgerHQ/coin-modules`)

1. **Framework:** document the `reserve` / `amountScale` rule on `estimateFees`, then remove `TransactionIntent.useAllAmount` in a major release.
2. **Coins:** make `estimateFees` return `reserve` without the flag, and remove every `useAllAmount` read in `estimateFees`, `validateIntent` and craft. Only **EVM** and **Tezos** need real work. Stellar needs a small fix. The others only delete code (Appendix A).
3. Bump the ledger-live catalog to coin-modules `main` first (coin-evm is on 10.0.0 vs 14.x, coin-stellar 11.0.1 vs 12.x).

### 3.2 ledger-live-common

| # | Item |
|---|---|
| L1 | **Contract test** (`ledger-wallet-framework/src/test-helpers/bridge-integration-suite.ts`): for every coin, `amount = estimateMaxSpendable(tx)` gives no error in `getTransactionStatus` and `status.amount === amount`, with and without a transaction. Today it exists only for Solana (`:722-737`) |
| L2 | **Generic bridge:** keep the max only in `estimateMaxSpendable.ts` and stop setting `useAllAmount: true` on the draft (`:34`). Add the staking start point (§2.1). Remove the max from `prepareTransaction.ts:112-127,154,163-167`, `buildIntent.ts:37-43`, `getTransactionStatus.ts:29`, `transactionToIntent` / raw serialization / token optimistic op in `utils.ts` |
| L3 | **Legacy-bridge coin modules** (not on the generic bridge): make `estimateMaxSpendable` the only max computation, stop recomputing in prepare/status/craft/sign, add explicit sweep fields where needed (Appendix B) |
| L4 | **`useSendMax` hook** (`flows/send`), shared by new and old flows: `isMaxActive`, `maxAmount`, `toggleMax()`. Debounced, cancels stale results, writes `amount`. Any manual edit or preset turns it off |
| L5 | **Analytics:** `isSendMax` comes from flow state through the sign context (`transaction-observability/src/signContext.ts:61`, `eventBuilders.ts:87`, `hooks/useBroadcast.ts:81`) |
| L6 | **Cleanup:** families `formatTransaction` (CLI "MAX"), 15 mock bridges, datasets, EVM edit-transaction/exchange/wallet-api forced `false`. Delete the unused native swap hooks (`exchange/swap/hooks/useUpdateMaxAmount.ts`, `useSwapTransaction.ts`) and the legacy solana/hedera bridges that no longer run |
| L7 | **Types:** remove `useAllAmount` from `TransactionCommon`, `TransactionCommonRaw`, `TransactionStatusCommonRaw` (`types-live/src/transaction.ts:113,125,179`); `fromRaw` ignores the field if present |

### 3.3 Front end (Desktop + Mobile)

- **New send flow:** Max calls `useSendMax().toggleMax()`. Remove every `useAllAmount ? status.amount : amount` branch, the `amount: 0` resets, and the flag in fee presets and "has amount" checks.
- **Old send flows:** same, and show the Max switch from `sendFeatures.canSendMax(currency)` instead of `typeof useAllAmount === "boolean"`. Mobile: max mode must survive into Summary, where fees can still be edited.
- **Staking flows:** toggle-based screens (Polkadot, Celo, Tezos, Solana, Aleo, EVM delegate) use `useSendMax`. "Full position" screens (NEAR, Aptos, Sui) set the coin's explicit field. Hard-coded `useAllAmount: false` is deleted.
- **CLI:** `--use-all-amount` calls `estimateMaxSpendable` and sets `amount`.

Detailed file list: Appendix C.

---

## 4. Migration plan

Family by family, behind a per-family descriptor flag `sendFeatures.maxSetsAmount(currency)` (next to `canSendMax`), so the UI and the coin never fight over the amount.

1. **Phase 0:** write the L1 contract test against today's behaviour. Make every `estimateMaxSpendable` work without the flag (the generic bridge, plus the legacy modules that set the flag on a draft or call prepare/status to get the max).
2. **Phase 1:** ship `useSendMax`, analytics and CLI. For families with `maxSetsAmount = false`, it keeps sending the flag. For `true`, it sends the concrete amount.
3. **Phase 2:** per family, remove the max from the coin (prepare/status/craft/sign, or `estimateFees`/`validateIntent`), add explicit sweep fields, turn `maxSetsAmount` on once the contract test passes. For coin-modules: EVM, Tezos, Stellar changes, then the framework major.
4. **Phase 3:** remove the flag from types, mocks and tests, remove `maxSetsAmount`, add a CI grep so it does not come back.

**Done when:** `git grep -w useAllAmount` is empty in both repos (except the tolerant `fromRaw` and the CI check), the contract test passes for every family, every sweep field is covered by a signing test, and send-max E2E passes for at least one coin per category.

---

## 5. Consequences

**Positive**
- One max implementation per coin, covered by one contract test.
- What is shown is what is signed: "Available", the input, `status.amount` and the signed amount are the same number.
- No API addition: coins keep the same `CoinModuleApi` surface, minus one intent field.
- Max, percentage presets and Live Apps share one model.

**Risks**
- **Stale max.** If the balance or fees change after the max was computed, the user gets `NotEnoughBalance` or a small leftover. Mitigation: recompute while max is active and right before the device step; validation is the safety net. Some coins re-read the balance at craft/sign today (Tezos, VeChain, Stacks, MultiversX, TON jetton, Polkadot, Sui, Kaspa) and will stop.
- **UTXO coins** (Bitcoin, Kaspa, Zcash, Cardano) must produce exactly "no change output" when `amount == max` for the same fee rate and UTXO set. Cardano is the most sensitive (LIVE-33176).
- **Amount-dependent fees** (VeChain VTHO, EVM L2, Tron TRC20, Cosmos gas, Tezos) must be solved inside `estimateMaxSpendable` / `estimateFees(amount = start)`, not hidden in prepare/status.
- **Breaking change** in `@ledgerhq/coin-module-framework`, with coordinated bumps of the external coin packages.

---

## 6. Open questions

| # | Question | Owner |
|---|---|---|
| Q1 | Sweep fields: coin-specific (preferred) or one generic `sweep?: boolean`? | Coin owners + framework |
| Q2 | TON: show `estimateMaxSpendable` as the amount while the chain sends the remaining balance? | TON owner + product |
| Q3 | Fee presets in max mode: show each preset with its own max, or only the fee for the current amount? | Send flow team |
| Q4 | Should 25/50/75% use `maxSpendable × ratio` instead of the raw balance (`useQuickActions.ts:19-25`)? | Product |
| Q5 | Stale max before signing: recompute silently or show "Amount updated"? | Product + design |
| Q6 | Solana stake create: max = delegated amount (rent subtracted) or total leaving the account (today)? | Solana owner + product |
| Q7 | Release timing for the framework major and external coin packages | Framework team |
| Q8 | Edit transaction (speed up / cancel) of a send-max: recompute the amount with the new fee, or keep failing with `NotEnoughBalance`? | Product + Bitcoin/EVM owners |

---

## Appendix A: coin-module-framework coins (generic bridge)

Can Ledger Live compute the max with `getBalance` + `getStakes` + `estimateFees`, without the flag?

| Coin | Today | Change needed |
|---|---|---|
| xrp | ✅ No flag in the package; reserve comes through `locked` (`logic/getBalance.ts:15-28`) | Version bump only |
| hypercore | ✅ No send support | Version bump only |
| hedera | ✅ `validateIntent.ts:283`: max = available − fees, same as the generic formula | Remove the flag branches (`:284,288,337`) |
| stellar | ✅ max = spendable − fees, `locked` = balance − spendable | Remove the flag (`validateIntent.ts:50,171,180,186`). Fix the ADR-060 double count (spendable already subtracts a fee) |
| casper | ✅ Simple fee subtraction | Remove the flag (`validateIntent.ts:68`) |
| tron | ✅ TRC20 max = token balance, fees paid in TRX | Remove the flag: once the amount is real, the token-balance substitution (`estimateFees.ts:128`) and the energy-rent rejection (`:541`) are no longer needed. `validateIntent.ts:115,181` |
| solana native / stake create | ✅ `reserve` (fee + unstake reserve) already returned unconditionally (`estimateFees.ts:122-127`) | Remove the flag in `craftTransaction.ts:240`, `validateIntent.ts:362,605,672,696`. Rent meaning: Q6 |
| solana Token-2022 | ⚠️ `transferFeeForIntent(amount, useAllAmount, …)`: the flag decides if the transfer fee is inside the amount (gross) or on top (net) | Explicit `amountIncludesFee`, or the coin derives it from `amount == token balance` |
| **evm delegate** | ❌ `reserve` / `amountScale` (static `STAKING_CONTRACTS` config) are returned **only with the flag** (`estimateFees.ts:253-262`) | Always return them for delegate intents. Delete `computeAmount` (`validateIntent.ts:394-430`) |
| **evm native on L2** | ⚠️ `SEND_MAX_L1_FEE_BUFFER` (×2) is applied to `additionalFees` only with the flag (`estimateFees.ts:248-251`) | Always return `reserve = fee + 2 × L1 fee`; keep `additionalFees` unbuffered so normal sends don't overpay |
| evm 0G undelegate | ⚠️ With the flag, undelegates all shares; otherwise share conversion loses 1 share (`staking/prepareIntents.ts:79,105-107`) | Keep the existing snap rule and derive "all" from `amount == delegated`, or an explicit `undelegateAll` |
| **tezos send** | ❌ The max needs `minFees` floor, burn − storage buffer, reveal and `DUST_MARGIN_MUTEZ` (`estimateFees.ts:214-238`), and simulation with `amount = spendable` fails, so it uses a 1 mutez probe | `estimateFees` probes internally when the amount is too high and always returns `reserve` = everything above. Craft stops re-fetching the account (`api/index.ts:154-170`) |
| **tezos stake** | ❌ `computeMaxStakeAmount` = liquid − (fees + `STAKE_USE_ALL_RESERVE_MUTEZ`), only with the flag (`:240-246`) | Always return `reserve = fees + STAKE_USE_ALL_RESERVE_MUTEZ` |
| tezos unstake | ❌ max = `stakedBalance`, only with the flag (`:247-249`) | Ledger Live starts from the staked position (§2.1). No coin change except removing the branch |
| tezos validation | `validateIntent.ts:80,100,115,209-245,407-479` skips positive-amount checks and recomputes the max; `TezosStakeAmountTooSmall` is only checked for max stake | Validate `intent.amount` only; apply `TezosStakeAmountTooSmall` to every stake |

## Appendix B: legacy-bridge coin modules

`estimateMaxSpendable` is already Ledger Live code here. The work is to make it the only max computation and to replace semantic uses of the flag.

**Amount only** (remove the max from prepare/status/craft/sign; rewrite `estimateMaxSpendable` if it sets the flag on a draft):
algorand, icon, internet_computer, mina, concordium, celo (per staking mode), polkadot (bond/unbond/rebond), sui (send/delegate), multiversx, filecoin, cosmos, stacks, vechain (VTHO fixed-point loop must live in `estimateMaxSpendable`), aleo, zcash, bitcoin, kaspa.

**Semantic uses needing an explicit field or an `amount == max` check:**

| Coin | What the flag selects today | Replacement |
|---|---|---|
| polkadot transfer | `balances.transferAll` vs `transferKeepAlive` (`logic/craftTransaction.ts:57-60`), device label, `PolkadotAllFundsWarning` | `transferMode: "keepAlive" \| "all"` |
| ton native | `CARRY_ALL_REMAINING_BALANCE` vs `PAY_GAS_SEPARATELY` (`utils.ts:110-125`), "ALL YOUR TONs" | `sendMode: "carryAll"` (Q2) |
| near | `unstake_all` / `withdraw_all` (`logic/actions.ts:21-26`), gas floor | `all: true` or new modes |
| sui unstake | Whole-object withdraw vs split (`network/sdk.ts:1498-1511`), principal check | `unstakeAll: boolean` |
| aptos staking | Skips min-amount and stake-left checks (`bridge/getTransactionStatus.ts:121-133,154-166`) | `amount == position` check |
| cardano | `sweepAll`: every UTXO, no change (`logic/craftTransaction.ts:183,216-234,363-388`) | `sweep: boolean` (exact `amount == max` is fragile, LIVE-33176) |
| hedera, kaspa | "Transfer All" device label | `amount == max` |
| aleo, zcash, bitcoin | Record / UTXO selection, no change output | `amount == max` gives the same selection |

**No logic:** coin-canton and the boilerplate only use the flag in `formatTransaction`; delete.

## Appendix C: front-end touch points

- **New send flow** (Desktop `mvvm/features/Send`, Mobile `mvvm/features/Send`, shared `flows/send`): `useAmountScreenViewModel.ts` (Max click), `useQuickActions.ts` (`isMaxActive`), `useAmountInput.ts` / `useAmountInputController.ts` / `useCoinControlAmountInput.ts` (displayed amount), `amountInputSync.ts`, `uriScheme.ts`, `useSendHeaderModel.ts` / `useSendHeaderViewModel.ts`, `useCustomFeesViewModelCore.ts:482-484`, `useCustomFeeValidation.ts:79-83`, `useFeePresetValuesCore.ts`, `utils/feeEstimation.ts`, `useSendFlowAmountReviewCore.ts:68`, coin-control VMs, Desktop `SponsoredSendContext.tsx`, `aleo/react.ts:151-181`.
- **Old send flow:** Desktop `modals/Send/fields/AmountField.tsx`, `components/SpendableAmount.tsx` (merge into `useSendMax`), `steps/StepSummary.tsx`; Mobile `screens/SendFunds/03a-AmountCoin.tsx`, `04-Summary.tsx`, bitcoin/evm `EditTransactionSummary.tsx`.
- **Staking:** Polkadot and Celo `AmountField.tsx` (Desktop) and amount screens (Mobile), Tezos Stake/Unstake, Solana `SelectAmount.tsx` (stop copying `status.amount` to nav params), Aleo, EVM `DelegationFlow/02-SelectAmount.tsx`, NEAR/Aptos/Sui unstake/withdraw modals; delete hard-coded `false` in EVM Undelegation/Withdraw and Aleo SelfTransfer.
- **CLI:** `apps/cli/src/transaction.ts:96-99`, `commands/blockchain/tokenApproval.ts:144`.

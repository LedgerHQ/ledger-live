# JIRA update plan — LIVE-29812 [Hedera] Plug to Generic Adapter

> Feedback loop from the **prototype** back into the epic. A prototype implementation walked the
> whole epic ticket by ticket (13 rounds); this file records what that exercise proved the epic is
> missing. Companion to [`generic-adapter-gap-analysis.md`](generic-adapter-gap-analysis.md) (pre-
> implementation gap classification) and
> [`integration-plan-generic-adapter.md`](integration-plan-generic-adapter.md) (the plan the epic was
> derived from).
>
> **No live status** per `.claude/rules/no-status-in-deliverables.md` — scope, dependencies and
> estimates only. Live state lives in JIRA.

## Metadata

- **Epic**: [LIVE-29812](https://ledgerhq.atlassian.net/browse/LIVE-29812)
- **Verified against**: `ledger-live` working tree on branch `wip/hedera-generic-adapter`,
  2026-08-20. Every claim below was read from code, not inferred from the prototype's own notes.
  **That branch is the evidence record, not a durable reference** — the prototype's `PLAN.md`,
  `gaps/GAP-A-buildIterateResult.md` and `gaps/OTHER-GAPS.md` live at
  `docs/hedera-generic-adapter/` on it. Re-read any `file:line` below against `develop` before
  implementing; the shared generic framework moves fast.
- **Epic total**: 42 SP → **67 SP** (+17 from five re-estimates, +8 for the one new ticket). The
  coin-tester work (5 SP) leaves this epic for LIVE-18702 via LIVE-34360, and its freed key
  LIVE-36153 is repurposed at the same 5 SP — so those two cancel out.
- **Out of this plan**: GAP A (forward `buildIterateResult` through the generic currency bridge) is
  owned by another team. LIVE-36154 keeps it as a declared blocker.

---

## Create (1)

### 1. LIVE-36276 — [HEDERA] Restore legacy prepare-transaction and validation parity on the generic path — 8 SP

Four behaviours the legacy bridge produced that nothing on the generic path replaces. All in `libs/`.

1. **Claim rewards** — inject `recipient = getEnv("HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID")` and
   `amount = 1` tinybar. Was `coin-hedera/src/bridge/prepareTransaction.ts:95-98`;
   `logic/craftTransaction.ts:214`'s `isStakingMode()` excludes `claimReward`, so it crafts a coin
   transfer to `""` with amount 0 and `validateIntent` never checks the recipient.
2. **The four dropped validation keys** — `insufficientAssociateBalance`, `missingAssociation`,
   `unverifiedAssociation`, `unverifiedEvmAddress` in `logic/validateIntent.ts`. All four are
   rendered or gating in production UI today (see LIVE-36147 below).
3. **Memo, libs half** — staking memos (`MAP_STAKING_MODE_TO_MEMO`), revive `memoValue`/`memoType`
   in `families/hedera/transaction.ts`, restore the **Memo** row in
   `families/hedera/deviceTransactionConfig.ts`, re-enable the memo-size check.
4. **ERC-20 gas** — thread the estimated gas limit through `buildIntentData`
   (`craftTransaction.ts:275` always falls back to `DEFAULT_GAS_LIMIT` today), and restore the
   **Gas Limit** device row.

Folds in GAP I (`mapIntentToSDKOperation` has no `claimReward` case → understated fee estimate) —
one line in the same function item 4 touches.

**Why 8 SP:** same shape and size as LIVE-36147 — another four-error-key parity job in the same
file — plus three independent parity fixes at ~1 pt each. One sub-item is real design work, not a
port: `insufficientAssociateBalance` needs a USD rate and `validateIntent` has no `CryptoCurrency`
to get one from. That is the estimate's risk; if it grows, split item 2 out rather than inflating
the ticket.

**Blocks** LIVE-36151 and LIVE-36152.

> **The second new ticket is not created — it reuses a freed key.** GAP H (validator hooks, 5 SP)
> goes into LIVE-36153, whose coin-tester content moves to the already-existing LIVE-34360. See
> update entries 10 and 11.

---

## Update (12)

### 1. LIVE-36144 — Add CoinFrameworkSigner over hw-app-hedera · estimate stays 3

Delete the `getAddress`-options caution: `hw-app-hedera` has no options argument and no verify flag,
so the real work is *dropping* the path and options args the framework passes. Fix AC "Receive
returns the account's `0.0.x` address" → it returns a **public key** (contradicts the ticket's own
earlier paragraph). Add that `signTransaction` hardcodes account index 0 — a device-app limit the
adapter cannot fix.

### 2. LIVE-36145 — retitle to **[HEDERA] Add the family layer: coinModuleApi, BridgeApi hooks, transaction and device config** · 5 → **8**

The old title named two of the four files it now owns. Absorb GAP B + C: `families/hedera/transaction.ts` (revive `valId`, `mode`, `fees`,
`assetReference`, `assetOwner`) and `families/hedera/deviceTransactionConfig.ts` (branch on generic
modes), with `loadTransaction` / `loadDeviceTxConfig` repointed off the legacy
`@ledgerhq/coin-hedera/*` modules. Promote `buildIntentData` from a code note to a named deliverable
with its own AC — without it **every staking transaction silently no-ops**. Add `computeIntentType`
as a second required hook.

*Why 8:* from two mappers plus a flag to five deliverables, two of them new files with their own
serialization and device-screen test suites.

### 3. LIVE-36146 — Persist hederaResources via buildAccountShape and accountRawAssign · 3 → **5**

Add the unstated prerequisite: coin-hedera has no `getAccountInfo` (ADR-045), so a new
`logic/getAccountInfo.ts` plus `api/index.ts` wiring is in scope — otherwise `buildAccountShape`
always receives `undefined`. Note the duplicate mirror-node fetch against `getBalance`.

*Why 5:* the ticket assumed the account-info source already existed.

### 4. LIVE-36147 — Add validateIntent method · estimate stays 8

State that the four named keys are **not** the full legacy set, and link LIVE-36276 for the
other four. Add that `computeIntentType` is a hard prerequisite or `redelegate`/`claimReward` throw
inside `transactionToIntent` before validation runs. Add that `ClaimRewardsFeesWarning` has no
generic equivalent (it needed the legacy `maxFee`). Correct "this is a port, not a design job" —
different signature, no `Account`, `bigint` not `BigNumber`, and the legacy validator source is the
preload singleton GAP H shows is broken.

*Estimate holds* because the four extra keys move to LIVE-36276.

### 5. LIVE-36148 — Support incremental sync in listOperations (relax minHeight) · 3 → **5**

Absorb GAP G — the ticket's title promises incremental sync but its filed scope only stops the
second sync from crashing. Its own code notes already point at the missing half ("keep paging on the
timestamp cursor the framework supplies"); the cursor never arrives.

`coin-hedera/src/api/index.ts:206` spreads `liveOp.extra` **flat** onto `Operation.details`, so
`pagingToken` is dropped: `adaptCoreOperationToLiveOperation`
(`generic-coin-framework/utils.ts:564`) only promotes known keys plus a nested `details.familyExtra`
bag. `getAccountShape.ts:515` therefore reads `undefined` on every sync and each "incremental" sync
re-fetches page one. Two implementation options, both one-liners:

- **(a)** nest `pagingToken` under `details.familyExtra` in `coin-hedera`, **and** change the read to
  `extra?.familyExtra?.pagingToken ?? extra?.pagingToken`. Note `utils.ts:563` already claims
  `familyExtra.pagingToken` is the cursor — the comment is wrong today, so this makes code and
  comment agree.
- **(b)** have `adaptCoreOperationToLiveOperation` promote a flat `details.pagingToken` alongside the
  keys it already knows. Likely safer: nesting *all* of Hedera's extras risks the other flat keys
  (`ledgerOpType`, `assetAmount`, `stakedAmount`) that consumers read today.

Both edits live in `ledger-live-common/src/bridge/generic-coin-framework/` — the same directory
LIVE-36154 already touches, so no other team is involved (unlike GAP A).

Also: state that AC #2 is satisfiable without achieving the intent — `mergeOps` dedupes by operation
id, so "neither duplicated nor lost" passes even with no cursor. Make the AC assert the cursor is
forwarded on the second sync. Record that the EVM-address invariant was reviewed and deliberately
left as-is.

*Why 5:* the crash fix is nearly free (delete an invariant), but the cursor half adds a shape choice,
a change in two packages, and a test that actually drives two syncs and asserts the forwarded cursor
rather than just the merged result.

### 6. LIVE-36149 — Close residual API gaps · estimate stays 3

Record the GAP D decision: `craftRawTransaction` stays throwing, matching tron/evm/cosmos, no ticket
needed. Note that `blockchain_txs` has only one possible value, so "token operations" is not
expressible there; the staking modes go in `staking_txs`.

### 7. LIVE-36150 — Route token association through changeTrust and verify CAL namespaces · estimate stays 3

Correct the framing: `computeIntentType` must **translate** `changeTrust` → `"token-associate"`, not
pass through — `craftTransaction` and `mapIntentToSDKOperation` dispatch on exact equality against
the legacy string, so a pass-through silently builds a plain coin transfer on Hedera's most
expensive operation. Move AC #1 (association crafted, signed, broadcast) to depend on the retitled
LIVE-36151/36152, since no UI emits `changeTrust` today. Record that the CAL check is
client-side-confirmed only and server-side needs a staging query.

### 8. LIVE-36151 — retitle to **[HEDERA] Migrate desktop UI to the generic transaction shape** · 3 → **8**

Widen from staking-only to all desktop flows:

- **staking** — unchanged
- **association** — `ReceiveWithAssociationModal/Body.tsx:174,178` emits `changeTrust` and drops
  `properties: { token }`; `steps/StepAssociationConfirmation.tsx:38` takes the token through
  StepProps instead of off the transaction (`Body.tsx` already holds it)
- **memo** — `MemoField.tsx:29` writes `memoValue`/`memoType`

Add an AC that the three restored recipient alerts render and the send-flow Continue gate blocks
again. Fix the file count: 9 → **14 desktop + 3 ledger-live-common**, adding
`ClaimRewardsFlowModal/Body.tsx`, all four flows' `types.ts`, `HederaGenericTransaction`, and the
`transaction-types.ts` + `generated/types.ts` union edits. Add the trap: a bare `GenericTransaction`
in that union breaks unrelated families (aleo, MemoTag) because `family: string` kills discriminated
narrowing. Remove the GAP H instruction — now LIVE-36153. New upstream dependencies:
LIVE-36276 and LIVE-36150.

*Why the retitle:* AC #4 ("No desktop component reads `transaction.properties` for Hedera") is
unachievable in the filed scope — the only reader is an association file.

*Why 8:* three flows and ~20 file touches; the original 3 SP under-counted *one* flow by roughly 2x.

### 9. LIVE-36152 — retitle to **[HEDERA] Migrate mobile UI to the generic transaction shape** · 3 → **8**

Same widening:

- **staking** — unchanged
- **association** — `AssociateTokenFlow/02-Summary.tsx:43,46` and `types.ts`; the token is already
  in `route.params`, so no new source is needed
- **memo** — `EditMemo.tsx:32`, `MemoTagInput.tsx`, `SendRowsCustom.tsx` write
  `memoValue`/`memoType`

Fix the file count: 7 product files → **12**, adding the four route `types.ts`. Add the trap:
`isStakingTransaction()` is a type guard over the *legacy* shape and must be removed from all four
`ValidationSuccess.tsx`. Keep the three fixture sets. Same new upstream dependencies as LIVE-36151.

*Why 8:* matches desktop — the prototype's mobile round showed mobile is not the cheaper side.

### 10. LIVE-36153 — repurpose to **[HEDERA] Move the validator hooks off the legacy preload singleton** · estimate stays 5

The coin-tester content is redundant with LIVE-34360 (entry 11), so this key is freed and reused
instead of creating a new ticket. Verified safe to repurpose: **zero comments, zero issue links** on
it today, so no history is left dangling. Replace title and description wholesale; keep the parent
epic (LIVE-29812) and the 5 SP proposal.

New content — GAP H. `families/hedera/react.ts`'s `useHederaPreloadData` / `useHederaValidators` /
`useHederaEnrichedDelegation` read a module-level singleton populated by `bridge.preload()`. The
generic currency bridge has no `preload` method (no generic-framework family does), so validator
search and delegation display return empty once the family flag flips. Read from
`account.stakingResources.validators` instead — already populated by the generic sync path.

*Why 5 holds:* a hook-signature change, not a one-liner. `useHederaValidators(currency)` has no
account in scope while `stakingResources.validators` lives on a synced account, so the ripple hits
both apps' validator-search and delegation-display screens. Surfaced by
`families/hedera/react.test.ts` failing the moment the flag flipped. Coincidentally the same 5 SP the
coin-tester content proposed, so no estimate churn.

### 11. LIVE-34360 — [HEDERA] Coin Tester · set the estimate to 5

Receives LIVE-36153's coin-tester description verbatim. The ticket exists already under epic
**LIVE-18702** "[HEDERA] Standard API Support (Alpaca)" with an **empty description**, so nothing is
overwritten.

Two edits to the moved text:

- It says "cover the flows **this epic** changes" — that self-reference breaks under a different
  epic. Name them explicitly: two consecutive syncs, send, HTS transfer, ERC-20 transfer,
  association, and all four staking flows.
- Add claim rewards to the scenario list — absent today, and it is the flow LIVE-36276 shows is
  most broken. Note that the tester is the cheapest place to catch the "signs and broadcasts but
  changes nothing on-chain" failure class this migration keeps producing.

**Epic membership is a deliberate choice.** Leaving it under LIVE-18702 is right — a coin tester is
standard-API/Alpaca work, which is why it was filed there. Add a *relates to* link to LIVE-29812 so
the migration epic can still see its coverage, rather than re-parenting.

### 12. LIVE-36154 — Register loader hooks and enable the generic adapter family flag · estimate stays 3

Drop "Hedera's loader entry has three of the seven hooks" — stale; all four missing hooks are now
owned by LIVE-36144/36145/36146. **Keep the "blocked on" section** (GAP A belongs to another team)
but note the fix is ~8 lines, and record that the prototype unblocked it locally. Add that no
rollback flag exists for any family, so rollback is revert-the-commits plus flip the JSON boolean —
not a live toggle. Add `hedera_testnet` config verification (GAP F) to the manual-matrix AC.

---

## Gap → destination

| Gap | Destination |
| --- | --- |
| A — `buildIterateResult` not forwarded | Another team. Stays a declared blocker on LIVE-36154 |
| B — no `families/hedera/transaction.ts` | Folded into LIVE-36145 |
| C — no `families/hedera/deviceTransactionConfig.ts` | Folded into LIVE-36145 |
| D — `craftRawTransaction` throws | Resolved, no ticket. Decision recorded on LIVE-36149 |
| E — `getAddress` options caution is wrong | LIVE-36144 description fix |
| F — `hedera_testnet` unchecked | LIVE-36154 manual-matrix AC |
| G — `pagingToken` cursor never arrives | Folded into LIVE-36148 |
| H — validator hooks read a dead singleton | LIVE-36153, repurposed |
| I — no `claimReward` case in `mapIntentToSDKOperation` | Folded into LIVE-36276 |
| Claim-rewards recipient/amount injection lost | Create-ticket 1, item 1 |
| Memo dropped end to end | Create-ticket 1 item 3 (libs) + LIVE-36151/36152 (UI) |
| Association UI never migrated | LIVE-36151/36152 |
| Four validation keys dropped, all UI-consumed | Create-ticket 1, item 2 |
| ERC-20 gas limit never reaches craft | Create-ticket 1, item 4 |

---

## Why the prototype found what the gap analysis could not

Three failure patterns worth carrying into the next generic-adapter epic:

1. **The generic framework replaces `prepareTransaction`, and nothing ports what the legacy one
   mutated.** `coin-hedera`'s legacy `prepareTransaction` performed four chain-specific mutations;
   `genericPrepareTransaction` performs one. Every unported mutation is a silent behaviour loss.
   Audit the legacy `prepareTransaction` line by line as a standard step.
2. **Legacy mode vocabulary is hardcoded deep in the coin module.** `craftTransaction` and
   `mapIntentToSDKOperation` dispatch on exact string equality against legacy mode names. Grep for
   every legacy mode literal in the coin module before assuming a hook is a pass-through.
3. **Failures are silent, not thrown.** Nearly every gap found — A, B, `buildIntentData`, the
   claim-rewards injection, the dropped validation keys — lets a transaction sign and broadcast while
   doing nothing, or enables a button that should be blocked. A green test suite is never evidence of
   readiness for this class of migration.

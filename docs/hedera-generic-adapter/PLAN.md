# PLAN — Hedera on the generic adapter (prototype)

**Goal:** a working prototype where Ledger Live runs Hedera through the generic coin framework, so we
can see how it behaves and confirm nothing is missing from Jira epic LIVE-29812.

**Not production.** Shortcuts are allowed when flagged. Coin-tester (LIVE-36153) is **out of scope**.

---

## PROGRESS

> Update this block at the end of every round. Keep it the first thing in the file.

| Round | Ticket | What | Status |
| --- | --- | --- | --- |
| 1 | LIVE-36144 | `families/hedera/signer.ts` + loader `loadSigner` | ✅ done |
| 2 | LIVE-36145 | `coinModuleApi.ts` + `bridge/api.ts` + 2 loader hooks | ✅ done |
| 3 | GAP A | forward `buildIterateResult` through the generic currency bridge | ✅ done |
| 4 | LIVE-36146 | `buildAccountShape` + `accountRawAssign` for `hederaResources` | ✅ done |
| 5 | LIVE-36148 | relax `minHeight` — second sync | ✅ done |
| 6 | GAP B + GAP C | `families/hedera/transaction.ts` + `deviceTransactionConfig.ts` | ✅ done |
| 7 | LIVE-36154 | default-tx switch + family flag → **first runnable build** | ✅ done (automated proof only — see notes) |
| 8 | LIVE-36147 | `validateIntent` | ✅ done |
| 9 | LIVE-36149 | max-send, balance options, `supportedFeatures` | ✅ done |
| 10 | LIVE-36150 | association via `changeTrust` + CAL check | ✅ done |
| 11 | LIVE-36151 | desktop staking UI → `valId` | ✅ done |
| 12 | LIVE-36152 | mobile staking UI → `valId` | ✅ done |
| 13 | — | manual verification pass + gap report back to Jira | ⬜ not started |

**Current round:** 13 (reserved for the user — manual verification, not to be started by a session)
**Last session notes:**

**Round 12 done — same pattern as Round 11, no new craft-time bug (mobile shares the fixed
`buildIntentData`), but one analogous trap: a legacy type guard.** Migrated the 4 mobile staking
flows (`DelegationFlow`, `RedelegationFlow`, `UndelegationFlow`, `ClaimRewardsFlow`) from
`AccountBridge<Transaction>` / `mode: HEDERA_TRANSACTION_MODES.X` / `properties.stakingNodeId` to
`useAccountBridge<HederaGenericTransaction>` / generic mode strings (`"delegate"`, `"redelegate"`,
`"undelegate"`, `"claimReward"`) / `valId`. 12 files touched: 4 `types.ts` (route param
`transaction: Transaction` → `HederaGenericTransaction`), the 4 screens that create/update the
transaction (`Summary.tsx`, both `Amount.tsx`, `Claim.tsx`), and all 4 `ValidationSuccess.tsx`.

**The trap: `isStakingTransaction()` (from `coin-hedera/logic/utils.ts`, re-exported via
`families/hedera/utils.ts`) is a type guard over the *legacy* `Transaction` shape — it narrows to
`TransactionStaking`, which has `properties.stakingNodeId`, not `valId`.** All 4
`ValidationSuccess.tsx` screens called `invariant(isStakingTransaction(transaction), ...)` before
reading `transaction.properties?.stakingNodeId`. Once `route.params.transaction` became
`HederaGenericTransaction`, that guard no longer applies — removed it and read `transaction.valId`
directly, matching how desktop's `StepConfirmation.tsx` already did it in Round 11 (no guard needed;
`valId` is always on the type). Desktop didn't hit this trap because its `StepConfirmation.tsx` never
used `isStakingTransaction` in the first place.

**Scope held at staking only**, same boundary as desktop: `AssociateTokenFlow` (association,
`HEDERA_TRANSACTION_MODES.TokenAssociate`) and `EditMemo.tsx` (send-flow memo editing, imports
`Transaction as HederaTransaction`) both still construct/consume the *legacy* transaction shape —
left untouched, exactly as desktop left `ReceiveWithAssociationModal` untouched in Round 11.
`Delegations/index.tsx` and `DrawerStakeActionIcon.tsx` also reference `HEDERA_TRANSACTION_MODES` but
only as UI action/icon keys, never touching a transaction object — no change needed.

**Environment note for the user's Round 13 pass:** this checkout had never run a lib build —
`@ledgerhq/live-engagement`, `@ledgerhq/live-dmk-mobile`, and `@ledgerhq/native-ui`'s `pre-ldls`
subpath were all missing their `lib`/`lib-es` output, which blocks mobile Jest at
`src/reducers/index.ts`'s import chain before any test logic runs (unrelated to this ticket's code —
pure environment gap). Fixed with a full `pnpm run build:libs` from repo root. Worth knowing if a
fresh `pnpm test:jest` locally throws `Cannot find module '@ledgerhq/...'` errors that look nothing
like hedera.

**Verification:** full mobile `pnpm typecheck` (`apps/ledger-live-mobile`) — exit 0, 0 errors overall,
0 mentioning `hedera`. Full existing hedera mobile Jest suite: **8/8 suites, 30/30 tests pass** —
including the 3 untouched suites (`AssociateTokenFlow` integration test, `Delegations/index.test.tsx`,
`AccountBalanceSummaryFooter.test.tsx`), confirming no regression outside the 4 staking flows. No test
file needed editing: `__mocks__/bridge.mock.ts` and the 4 flows' integration tests never asserted on
`properties.stakingNodeId` directly (they only check navigation/testIDs), so they kept passing
unmodified once the production code was correct — same finding as Round 11's desktop pass.

**Round 13 (manual verification + Jira report-back) is the user's own step, not to be started by a
session.**

**Round 11 done. Paused before Round 12 (mobile) at the user's request — context budget, not a
blocker.** Two real findings beyond "move 9 files," both fixed:

**Critical: staking would have silently no-op'd without `buildIntentData`.** Traced the crafting path
for a delegate/redelegate/undelegate transaction and found `logic/craftTransaction.ts`'s staking
branch reads the target node id from `intent.data.stakingNodeId` — **never** from `intent.valId`
directly. coin-hedera has no `craftTransactionData` of its own, so the framework's no-op default
(`{type:"none"}`) was the only thing ever produced. Net effect: every staking transaction would have
signed and broadcast looking correct while changing nothing on-chain — the crafted
`AccountUpdateTransaction` never carried a staked-node instruction. Fixed by adding
`buildIntentData` to `families/hedera/bridge/api.ts`, mapping `{mode, valId}` → `{type:"staking",
stakingNodeId}` (null for undelegate, matching the legacy `clearStakedNodeId()` trigger). This is
exactly what LIVE-36151's own 2nd acceptance criterion ("the selected node id is carried correctly
from selection through to the signed transaction") was testing for — it would have failed without
this, ticket or no ticket. Proven with a `genericFlip.test.ts` case driving `transactionToIntent`
end-to-end and asserting `intent.data`.

**A `GenericTransaction` union member broke unrelated families — reverted, replaced with a
literal-branded type.** First attempt: add `GenericTransaction` to `coin-modules/transaction-types.ts`'s
big `Transaction` union (needed so `useBridgeTransaction<T extends Transaction>` can infer `T` for
hedera's staking flows). This compiled `ledger-live-common` clean but broke desktop's **aleo** family
UI and `mvvm/features/MemoTag/utils.ts` with real type errors — caught by running the full desktop
`tsc`, not assumed. Root cause: `GenericTransaction.family: string` (not a literal) poisons
`switch(transaction.family)` discriminated-narrowing for **every** member of that union, not just
hedera's — code doing `case "xrp": return transaction.tag` or `case "casper": return
transaction.transferId` stopped narrowing correctly the moment a non-literal-`family` member joined
the union. Reverted. Fixed properly by adding `HederaGenericTransaction = GenericTransaction &
{family: "hedera"}` as a **new, additional** export in `families/hedera/types.ts` (the existing
`Transaction`/`TransactionRaw` re-export there is untouched — still the legacy shape the send flow
(`MemoField.tsx`) and mobile, both un-migrated, depend on) — literal-branded, so it narrows correctly
everywhere. Added `HederaGenericTransaction` (not bare `GenericTransaction`) to the union in both
`coin-modules/transaction-types.ts` **and** `generated/types.ts` (a byte-identical, separately
git-tracked mirror of the first file with no generator script found — hand-edited both to keep them
in sync, matching how they already were before this change).

**Files touched, beyond the 9 the ticket names:** `ClaimRewardsFlowModal/Body.tsx` (10th file — sets
the mode too, ticket's table only listed its `StepConfirmation.tsx`) plus all four flows'
`types.ts` (StepProps referenced the legacy `Transaction`/`TransactionStatus`, had to move to
`HederaGenericTransaction`/`TransactionStatusCommon` for the 9+1 files to typecheck against what the
real generic bridge now produces) — 14 desktop files in total, plus the 3 `ledger-live-common` files
above.

**Verification:** full desktop `tsc -p apps/ledger-live-desktop/tsconfig.json` — zero errors
mentioning `families/hedera`, `aleo`, `GenericTransaction`, `HederaGenericTransaction`, or
`MemoTag`; the ~536 errors remaining are pre-existing baseline noise in files this round never
touched (confirmed by name — `account/formatters.ts`, `apps/filtering.ts`, semver typings, etc.), not
new regressions. `oxlint` on the whole `families/hedera` desktop tree: 0 errors (34 pre-existing
shadowing warnings). **Full existing desktop hedera test suite: 10/10 suites, 46/46 tests pass** —
notably including `sendFlow.integ.test.tsx` (5 tests) and `MemoField.test.tsx` (5 tests), i.e. the
send flow this round deliberately did not touch is confirmed still green, and
`ReceiveWithAssociationModal`'s 2 suites (12 tests) also pass untouched. No test file needed editing —
existing integration tests already exercised the real component tree end-to-end and simply started
passing once the production code was correct (the ticket's own "existing desktop tests updated"
criterion turned out to require no test changes, just the implementation fix).

**Round 12 (LIVE-36152, mobile) not started.** Same category of work — `transaction.properties.stakingNodeId`
→ `valId` across 4 mobile staking flows, 3 fixture sets — expect the same two traps to reappear
(mobile likely has its own `useAccountBridge<Transaction>` call sites needing `HederaGenericTransaction`,
and mobile's own transaction-type union, if one exists, may need the same literal-branded addition).
Round 13 (manual verification) is explicitly the user's own step, not to be started by a session.

**Round 10 done — and it surfaced a real dispatch bug the ticket's framing didn't anticipate.** The
ticket says "reuse `changeTrust`... route through the family's own intent-type hook," which reads as
if `computeIntentType` just needed to *exist* (already true since Round 8/9's pass-through). Checked
what actually consumes `intent.type` for an association transaction and found `logic/craftTransaction.ts`
and `logic/utils.ts`'s `mapIntentToSDKOperation` (used by `api/index.ts`'s own `estimateFees` method)
both dispatch on **exact equality against the legacy `HEDERA_TRANSACTION_MODES.TokenAssociate`
("token-associate") string** — neither recognizes `"changeTrust"`. Left as a pure pass-through
(Round 8/9's shape), a `changeTrust` transaction would silently fall through `craftTransaction`'s
if/else chain to the final catch-all — **building a plain coin transfer instead of an association**,
with no error, on the single most expensive operation in Hedera's fee schedule (the ticket's own
words). Not a hypothetical: verified by tracing the exact dispatch chain, not by running it against a
device.

**Fix:** `computeIntentType` now translates `"changeTrust"` → `HEDERA_TRANSACTION_MODES.TokenAssociate`
specifically (delegate/undelegate/redelegate/claimReward still pass through unchanged, matching Round
8/9). This is the one legacy-vocabulary translation this hook needs to do — coin-hedera's internal
crafting/fee-routing code stays untouched, which is what "route through the family's own intent-type
hook" was actually asking for: translate at the one seam the framework calls before any of that code
runs, so nothing downstream needs a second vocabulary. Updated `validateIntent.ts`'s `changeTrust`
dispatch to match (it now also checks `HEDERA_TRANSACTION_MODES.TokenAssociate`, consistent with
`craftTransaction`).

**Registry check result, recorded on the ticket** (`tickets/LIVE-36150.md`): confirmed
`findTokenByAddressInCurrency` does a bare passthrough to a remote lookup with no local normalization
— `0.0.x` and `0x…` are lexically disjoint, so no client-side collision is possible. What this repo
cannot verify is server-side CAL behavior (no network access from this sandbox, and it's outside this
codebase) — recorded as "client-side confirmed safe, server-side needs a manual staging query," not
claimed as a full verification.

**GAP I found, not fixed, ticket needed.** While fixing the same `mapIntentToSDKOperation` function,
noticed it has no `claimReward` case — falls to the default `CryptoTransfer`, understating the fee
`prepareTransaction` displays before signing (should be `CryptoUpdate`, matching what
`validateIntent.ts` already computes correctly for the same mode). Pre-existing, only exposed by this
epic routing staking through `prepareTransaction` for the first time. Left unfixed — one line, but out
of this round's stated scope; logged with the fix already identified for whoever picks it up.

Tests: `families/hedera/bridge/api.test.ts` — `computeIntentType`'s changeTrust case now asserts the
translated value instead of pass-through. `families/hedera/genericFlip.test.ts` +1 — the real
regression guard: drives an actual `changeTrust` `GenericTransaction` through `transactionToIntent`
with hedera's live `computeIntentType` and asserts `intent.type === "token-associate"` (this is
exactly the check that would have caught the silent-coin-transfer bug before it shipped).
`validateIntent.test.ts`'s changeTrust test updated to use the post-translation value, matching what
it actually receives in production. Full `tsc --noEmit` clean on both packages, `oxlint` 0 errors,
full coin-hedera suite 42/42 suites / 588/588 tests, full non-integration hedera+generic-framework
sweep in ledger-live-common: 34/35 suites / 500/504 tests — same pre-existing GAP H failure only.

**Round 9 done — the smallest of the remaining rounds, three independent one-line-ish fixes plus a
gap resolution.**

1. **Max-send.** Removed `invariant(!txIntent.useAllAmount, …)` from `craftTransaction`. Traced why
   that's the *entire* fix: `genericPrepareTransaction` (ledger-live-common) already resolves
   `useAllAmount` to a concrete `intent.amount` (spendable balance minus the same safety-multiplied
   fee estimate `craftTransaction` itself reserves via `customFees`) **before** `craftTransaction` is
   ever called — the crafting logic reads `txIntent.amount` unconditionally and never branched on
   `useAllAmount` for anything. No other code change needed; the invariant was pure leftover guard
   with nothing left to guard.
2. **Balance options.** Left `getBalance` rejecting any options (unchanged behavior) — but the
   decision is now a comment, not silence: `BridgeApi.balanceOptions` is unset in
   `families/hedera/bridge/api.ts`, nothing supplies options today, so there is nothing to support.
   Revisit only if that field ever gets set.
3. **`supportedFeatures`.** Added `staking_txs: ["delegate","undelegate","redelegate","claimReward"]`
   — matches `coin-cosmos`'s declaration exactly (same four modes). `blockchain_txs` was already
   correct: the feature's `BlockchainTxsIntent` type has only one possible value ("send"), so there is
   no separate intent to declare for HTS/ERC20/association — "token operations" in the ticket's
   description doesn't imply a new key here.

**GAP D resolved, not deferred.** Checked whether swap/sell actually needs `signRawOperation` by
looking at the three already-shipped generic-framework families with the same "has an exchange
integration" shape as Hedera — tron, evm, cosmos. All three throw the identical
`"craftRawTransaction is not supported"`, unfixed, with no open ticket. That is direct evidence
`signRawOperation` isn't on Hedera's (or their) swap/sell path — if it were, one of three production
currencies would already have a filed bug. Recorded as resolved in `OTHER-GAPS.md`; no ticket opened.

Tests: `craftTransaction`'s stale "should throw" replaced with a successful useAllAmount craft (ticket's
own acceptance criterion: "existing tests asserting the two rejections are updated" — ships alongside
its own passing case, not a silent edit). `supportedFeatures.test.ts` +1 asserting the four staking
modes. Full `tsc --noEmit` clean, `oxlint` 0 errors, full coin-hedera suite 42/42 suites, 588/588
tests.

**Round 8 done — but it is not "a copy of getTransactionStatus," and treating it as one would have
produced broken code.** Worth recording precisely, since the user's working assumption going in was
exactly that. Three concrete reasons it's a port with real design work, not a copy:

1. **Different signature entirely.** `getTransactionStatus(account, transaction)` has the full
   `Account` (and legacy `Transaction`) in hand. `CoinModuleApi.validateIntent(context, intent,
   balances, options)` — the hook this round actually implements — gets a chain-agnostic
   `TransactionIntent` + `Balance[]`, no `Account`, all `bigint` not `BigNumber`. Every read of
   `account.hederaResources`, `account.balance`, `findSubAccountById(account, …)` had to be re-derived
   from `balances` or a fresh network call — there is no `Account` to read them from.
2. **The validators list source is broken on the generic path.** Legacy reads
   `getCurrentHederaPreloadData(account.currency).validators` — the exact singleton **GAP H (Round 7)
   already found is never populated** once the family is generic. Porting that call verbatim would
   make every staking-node-id check silently fail forever. Used `apiClient.getNodes({fetchAllPages:
   true})` directly instead — bypasses the broken preload path entirely (does not fix GAP H's UI
   hooks, just avoids depending on the same broken mechanism here).
3. **It lives in a different package.** `validateIntent` is a `CoinModuleApi` method — it belongs in
   `coin-hedera/src/logic/validateIntent.ts` + wiring in `coin-hedera/src/api/index.ts`, not in
   `ledger-live-common/src/families/hedera/`. Modeled directly on `coin-tron/src/logic/validateIntent.ts`
   — the one other family that already implements this hook on the generic path.

**A real, previously-undocumented blocker was found and fixed as a necessary part of this round, not
deferred:** `generic-coin-framework/utils.ts`'s `defaultComputeIntentType` only allows `["changeTrust",
"send","send-legacy","send-eip1559","stake","unstake","finalize_unstake"]` — `redelegate` and
`claimReward` (2 of the 4 staking modes the ticket's own six-key bar requires testing) fall through to
its `throw new Error("Unsupported transaction mode: …")`. That throw happens inside
`transactionToIntent`, which both `validateIntent` and `signOperation` call — so without a fix,
redelegate/claim-rewards would hard-crash before reaching any validation, not just fail a check.
Added `computeIntentType` to `families/hedera/bridge/api.ts`: passes every generic mode through
unchanged (simpler than trying to lean on the default's incidental allowance of `delegate`/`undelegate`
via its `stake`/`unstake` remap). This is **not** LIVE-36150/Round 10's association-mapping work —
`changeTrust` already passes the default allowlist unmodified; this hook exists solely to stop
`redelegate`/`claimReward` from throwing. Proven with a new test in `genericFlip.test.ts`:
`transactionToIntent` no longer throws for either mode.

**Scope deliberately trimmed to the ticket's own stated bar** ("the bar is the error keys, not the
presence of errors"): implemented the four Hedera-specific keys (`stakingNodeId`,
`missingStakingNodeId`, `noRewardsToClaim`, `fee`) plus generic `amount-required`/`not-enough-balance`
for send and token transfer. **Not ported:** `insufficientAssociateBalance` (association USD-funding
floor — needs `getCurrencyToUSDRate(Currency)`, which needs a `CryptoCurrency` object `validateIntent`
doesn't have; and it's not one of the four required keys), the HTS/ERC20 association-status warnings
(`missingAssociation`/`unverifiedAssociation`/`unverifiedEvmAddress` — genuinely warnings, don't gate
the button, need extra network round-trips), and the memo-size check (`HederaMemoExceededSizeError` —
moot right now: Round 6 never wired `memoValue`/`memoType` onto the generic transaction, so
`intent.memo` is always `{type:"NO_MEMO"}` and the check can never fire). All three are flagged in the
code with why, not silently dropped. `changeTrust`'s own validation is a bare fee estimate with no
error path — genuinely nothing left to check once the funding floor is out of scope; that branch is
Round 10's to fill in.

**Files:** `coin-hedera/src/logic/validateIntent.ts` (new, ~230 lines — four branches: native send,
token transfer, changeTrust, staking), wired into `logic/index.ts` and `api/index.ts` (replacing the
stub throw). `families/hedera/bridge/api.ts` gained `computeIntentType`.

**Tests:** `logic/validateIntent.test.ts` (20, new) — one test per required error key on its exact
triggering condition, per the ticket's second acceptance criterion, plus the fee-key check
parameterized across all four staking modes (matching the legacy parity oracle's own
`Promise.all([delegate, undelegate, redelegate, claimRewards])` structure). `api/index.test.ts`'s
stale "should throw when called" replaced with a delegation test (the ticket's own 5th acceptance
criterion: "existing tests that assert validateIntent throws are updated" — not a silent edit).
`bridge/api.test.ts` +2 for `computeIntentType`. `genericFlip.test.ts` +1 (parameterized ×2) proving
the `transactionToIntent` fix. Full `tsc --noEmit` clean on both packages, `oxlint` 0 errors on all
changed files. Full `coin-hedera` suite: 42/42 suites, 587/587 tests. Full non-integration
`hedera`+`generic-coin-framework` sweep in `ledger-live-common`: 34/35 suites, 499/503 tests — the 4
failures are Round 7's already-documented GAP H (`react.test.ts`'s preload singleton), untouched and
unrelated to this round.

**Round 7 done — the flip.** Three changes:

1. Added `case "hedera":` to `createTransaction.ts`'s `near | vechain | cardano` zero-nonce branch —
   Hedera has neither a chain nonce nor an account sequence, so it belongs in the same group; keeps
   `getNextSequence` (still throwing, on purpose per the ticket) out of the signing path.
2. Added `"hedera": true` to `genericCoinFrameworkFamilies.json`.
3. Confirmed all four loader hooks (`loadLocalApi`, `loadSigner`, `loadBridgeApi`,
   `loadAccountRawAssign`, from Rounds 1-2-4) are already registered — nothing left to add there,
   contrary to the ticket's "has three of seven" framing, which predates Rounds 1-4.

**Sweep of pre-migration throws (ticket's acceptance criterion #4) — concluded nothing needs changing
right now.** Re-checked every throw/invariant the ticket's own code notes call out:
`useAllAmount` (still throws — that's LIVE-36149/Round 9's job), balance options (still throws —
same), `validateIntent` (still throws — LIVE-36147/Round 8's job, not done yet), `minHeight` (already
fixed in Round 5), `getNextSequence` (stays throwing forever, by design). The ticket's code-notes list
was written before the round-by-round split existed; each item's actual owner is a later round, not
this one — flagging so nobody re-derives this from scratch.

**Verified no other family-name switch in the generic framework would silently exclude Hedera**:
grepped every `case "<family>"` / `family ===` across `generic-coin-framework/*.ts` — the only two are
`createTransaction.ts` (fixed here) and `utils.ts`'s `mode`-keyed switch (already generic, unrelated
to family name). Also confirmed the family flag has exactly one consumer in the whole monorepo
(`bridge/impl.ts`) — no companion app-level flag to flip, so the JSON edit is the entire dispatch
change.

**"Done when" is split between automated and manual.** The plan's literal done-when — "desktop starts,
an existing Hedera account syncs, a plain HBAR send reaches the device" — is a live-app,
physical-device check this session cannot perform (no device, no interactive desktop session here);
per the user's original framing, that manual pass is explicitly *their* step once the code is ready.
What this session *can* and did prove automatically:
- `families/hedera/genericFlip.test.ts` (new, 4 tests): `isGenericCoinFrameworkFamily("hedera")` is
  now `true`; `getCoinFrameworkAccountBridge("hedera", "local")` resolves a full bridge (sync,
  createTransaction, signOperation, receive, both raw-assign hooks) with **no custom signer** — i.e.
  the real Round-1 signer loader, not a stub; `getCoinFrameworkCurrencyBridge` resolves
  `scanAccounts` wired to hedera's `buildIterateResult`; `createTransaction` produces the zero-nonce
  default end-to-end through the bridge, not just the unit-level function.
- Regression sweep, per the ticket's own criteria: `families/stellar` (an already-migrated family) —
  14/14 still pass. `coin-hedera`'s full legacy suite — 41/41 suites, 567/567 tests still pass
  unaffected (the legacy bridge is untouched; only the *dispatch* changed). Full non-integration
  `ledger-live-common` suite kicked off in the background as a final broad check — result pending,
  will be recorded before Round 8 starts if anything surfaces.

Tests added: `createTransaction.test.ts` +1 case (hedera, zero-nonce), `genericFlip.test.ts` (4, new
file — the capstone proof for this round). Full `tsc --noEmit` clean, `oxlint` 0 errors.

**Full-suite sweep found one real, new regression: `families/hedera/react.test.ts` (a plain unit
test, not integration) now fails.** Root-caused, not papered over: `bridge/cache.ts:prepareCurrency`
populates the legacy `coin-hedera/preload-data` singleton by calling `bridge.preload(currency)` on
the account's *currency bridge*; the generic currency bridge has no `preload` method at all (no
generic-framework family does), so it silently no-ops, the singleton stays empty, and
`useHederaValidators`/`useHederaEnrichedDelegation` return nothing. Logged as **new GAP H** — it's
broader than the already-known "staking UI broken until Round 11/12" window, because
LIVE-36151/36152 only fix `transaction.properties.stakingNodeId` reads, not the separate
validator-search/delegation-display path these hooks feed. **Did not touch `react.test.ts`** — per
this plan's own ground rule, this is exactly the anticipated intermediate-breakage window (just a
different mechanism than expected), not something to "fix early," and the test currently pins the
*correct* eventual behavior. First round-7 sweep attempt used a bad CLI override
(`--testPathIgnorePatterns "integration"` replaces, not extends, the project's default ignore list),
which surfaced ~20 false-positive "must contain at least one test" failures from `__tests__/test-helpers/*`
— re-ran with the default jest config (no override) to get a clean signal; every other failure across
the whole `ledger-live-common` suite is a `*.integration.test.ts` file hitting real network
(near/solana/cosmos/multiversx/evm — none Hedera-specific, none touched by this round), consistent
with every prior round's sandbox-network finding.

**Net for Round 7:** code changes are correct and minimal (2 files + 1 loader confirmation); the flip
is real and proven by `genericFlip.test.ts`; one genuine UI-visible gap (GAP H) was surfaced rather
than hidden. Recommend GAP H's fix land no later than Round 11 (desktop staking UI), since it affects
the same screens.

Round 6 done. Created `families/hedera/transaction.ts` and `families/hedera/deviceTransactionConfig.ts`,
repointed both loaders off `@ledgerhq/coin-hedera/*` (the legacy modules) onto these.

**Design call: target `GenericTransaction` directly, no local `Transaction`/`TransactionRaw` type.**
Tezos/stellar/evm's family-local `transaction.ts` files all revive their *own* local `Transaction`
type (`./types.ts`) — but checked, and that's because those types predate the generic framework (evm
still runs its legacy bridge in parallel) or were reused as-is. `families/hedera/types.ts` re-exports
coin-hedera's *legacy* types (`properties.stakingNodeId`, `memo`, `maxFee`) — reusing those for the
generic path would silently resurrect the very shape LIVE-36151/36152 are removing. Since there was no
pre-existing generic-path type to stay compatible with, `transaction.ts` and
`deviceTransactionConfig.ts` import `GenericTransaction`/`GenericTransactionRaw` from
`generic-coin-framework/types` directly — `TransactionModule`'s generics default to `any`, so nothing
in the loader contract forces a local type.

**Scope held to the plan's stated field list** — `valId`, `mode`, `fees`, `assetReference`,
`assetOwner` — deliberately **not** `memoValue`/`memoType`, even though `GenericTransaction` has both
and legacy Hedera has a memo field. Memo device/UI support isn't asked for by any ticket read so far;
flagging rather than guessing. Similarly, the device config keeps to what GAP C actually complains
about (the Method row for `changeTrust`/`claimReward`) — no Gas Limit or Memo field, unlike the legacy
`deviceTransactionConfig.ts`.

`STAKING_METHOD_BY_MODE` in the new device config re-keys coin-hedera's own `MAP_STAKING_MODE_TO_METHOD`
(`constants.ts:105`) from legacy mode names (`claim-rewards`) onto generic ones (`claimReward`) — same
label strings, so the on-device wording is identical to the legacy path.

Tests: `transaction.test.ts` (3) is the round's literal "done when" — round-trips a staking transaction
carrying `valId` through `toTransactionRaw` → `fromTransactionRaw`, plus a token-transfer case
(`assetReference`/`assetOwner`) and a bare-send case (nothing set stays unset, not coerced to `""`/`0`).
`deviceTransactionConfig.test.ts` (7, modeled on `stellar/deviceTransactionConfig.test.ts`) covers
plain send, `useAllAmount`, `changeTrust`, all four staking modes' labels, and the no-`valId` case.
Full `tsc --noEmit` clean, `oxlint` 0 errors (pre-existing unrelated warnings only, matching the
`as any` pattern already used in `stellar/deviceTransactionConfig.test.ts`).

Ran the full `hedera` + `generic-coin-framework` suite as a final check (521 tests): 494 pass, 27 fail
across exactly two suites, both pre-existing and unrelated to this round —
`families/hedera/bridge.integration.test.ts` (the known sandbox-network issue from Rounds 2-3) and
`bridge/generic-coin-framework/getAccountShape.integration.test.ts` (an **EVM**, not Hedera, live-RPC
integration test — 360s runtime confirms it is a real network timeout against this sandbox's
allowlist, not something Round 6 touched or broke).

Round 5 done — smallest round so far. Deleted `invariant(minHeight === 0, "minHeight is not
supported")` from `coin-hedera/src/api/index.ts:listOperations`. Confirmed by reading
`logicListOperationsV2`'s call that `minHeight` was never forwarded to it anyway — only `cursor`,
`limit`, `order` are — so the invariant was rejecting a value the function doesn't even use. Removed
`minHeight` from the destructure too (unused).

**"Check the evm-address assertion" (ticket's own ask) — investigated, left alone, documented.**
`invariant(evmAddress, ...)` throws whenever `toEVMAddress` returns `null`, which it does on *any*
network error (its `catch` swallows everything). That is a real fragility — a transient mirror-node
blip on an incremental sync fails the whole sync instead of degrading — but it is orthogonal to
`minHeight`: every Hedera account has had an EVM address since the alias HIP landed, so this isn't a
second-sync-specific problem, and acceptance criteria don't ask for it. Left as-is; flagged here rather
than silently touching error-handling behavior outside the ticket's scope. **Candidate for GAP G if
this needs a ticket of its own** — not added to `OTHER-GAPS.md` yet since it's speculative (never
observed failing, no repro).

**Real cursor is unresolved — same duplicates/no-loss outcome, but not truly incremental.** Traced
whether `cursor` (`oldOps[0]?.extra?.pagingToken`, `getAccountShape.ts:515`) actually reaches a second
Hedera sync: `logic/listOperations.v2.ts:47` sets `extra.pagingToken` on every op, and
`api/index.ts`'s `details: { ...liveOp.extra, ... }` carries it into `Operation.details.pagingToken`.
But the generic framework's `adaptCoreOperationToLiveOperation`
(`generic-coin-framework/utils.ts:499`) only promotes specific known keys onto `Operation.extra`, plus
whatever sits under a nested `details.familyExtra` key — a flat `details.pagingToken` (Hedera's shape)
is neither. So `oldOps[0]?.extra?.pagingToken` is always `undefined` for Hedera, `cursor` is never
forwarded on a real sync, and every "incremental" sync actually re-fetches the same page from
scratch. Acceptance criteria (no duplicates, nothing lost) still hold because `mergeOps` dedupes by
operation id and only ever adds, never removes — but this is not the efficient incremental sync the
ticket's "likely fix" describes. **Real fix needs one of:** (a) hedera nests its extras under
`details.familyExtra` instead of spreading them flat, or (b) the generic framework also promotes a
flat `details.pagingToken`. Neither is a `families/hedera` or `coin-hedera` one-file change — it's
framework-level. Added as **GAP G** to `OTHER-GAPS.md`.

Tests: replaced `api/index.test.ts`'s "should throw when minHeight is not 0" (pinned the now-removed
behavior — updated per the ticket's own acceptance criterion "existing tests … are updated", not a
silent test edit) with two: one confirming a second sync's `minHeight` no longer throws, and the
round's actual "done when" — two `listOperations` calls back to back (mocked to return disjoint ops on
each call) asserting both succeed and the combined id set has no duplicates. `coin-hedera` full suite:
41 suites / 567 tests pass (was 566 — net +1 after replacing one test with two). `ledger-live-common`
typecheck still clean (unaffected package, checked anyway since it depends on coin-hedera).

Round 4 done, with one addition beyond the ticket's stated file list: coin-hedera had no
`getAccountInfo` (ADR-045), so `buildAccountShape(address, accountInfo?)` would always have received
`accountInfo: undefined` — `families/hedera/bridge/api.ts` alone can't fetch anything (per the
`coin-modules` skill, network calls belong in the coin-module package, not `families/`). Added
`libs/coin-modules/coin-hedera/src/logic/getAccountInfo.ts` (`HederaAccountInfo = { type: "hedera",
maxAutomaticTokenAssociations, stakedNodeId, balance, pendingReward }`, one `apiClient.getAccount`
call) and wired it into `api/index.ts`, mirroring coin-tron's `getAccountInfo` — the only other
existing implementation in the repo, since no family had implemented `buildAccountShape` before this
either. **Known inefficiency, flagged not fixed:** this duplicates a mirror-node account fetch that
`getBalance` already makes internally but doesn't expose — acceptable for a prototype, a production
version would share the one fetch between both hooks.

`families/hedera/bridge/api.ts` gained `buildAccountShape`: maps `HederaAccountInfo` onto `{
hederaResources: { maxAutomaticTokenAssociations, isAutoTokenAssociationEnabled, delegation } }`.
`delegated` is set to the account's whole balance, not a separate staked amount — matches the legacy
bridge's own choice (`bridge/synchronisation.ts:112`): Hedera stakes the full balance to a node, there
is nothing else to track. `families/hedera/accountRawAssign.ts` is a 2-line re-export of coin-hedera's
existing `bridge/serialization.ts` (`assignFromAccountRaw`/`assignToAccountRaw` were already there,
untouched — ticket's note was accurate). Registered `loadAccountRawAssign` in `loaders.ts`.

Tests: `coin-hedera/src/logic/getAccountInfo.test.ts` (2), `families/hedera/bridge/api.test.ts` +4
(`buildAccountShape`), and the round's actual "done when" proof —
`families/hedera/accountRawAssign.test.ts` (2 new) — drives `getAccountRawAssignHooks("hedera")` (the
same function the real account bridge calls) through a live `assignToAccountRaw` → JSON round trip
(confirms `BigNumber` degrades to a bare string, per bignumber.js's `toJSON`) → `assignFromAccountRaw`,
for both a delegating and a non-delegating account, and asserts the revived `delegated`/`pendingReward`
are `BigNumber` instances again. Full `tsc --noEmit` clean on `ledger-live-common`; `coin-hedera`'s own
`tsc --noEmit` has pre-existing unrelated errors in dependency packages (`bip32-path`, `hw-transport`,
`live-network`, …), none touching hedera. `oxlint` 0 errors on both packages (one real duplicate-import
error caught and fixed in `bridge/api.test.ts` before it counted as done). All 566 coin-hedera tests
and all 55 non-network hedera/generic-framework tests in ledger-live-common pass; the one integration
suite that still fails is the same pre-existing sandbox-network issue from Rounds 2-3.

Round 3 done — and upgraded from the shortcut to the real fix. While wiring the pass-through,
`getCoinFrameworkCurrencyBridge`'s only call site (`bridge/impl.ts:94`, inside `buildCurrencyBridge`)
turned out to already have `currency` in scope — it's the function's own parameter, just not
forwarded. So instead of GAP-A.md's documented `typeof bridgeApi === "function" ? undefined` shortcut,
threaded a real optional 4th param: `getCoinFrameworkCurrencyBridge(network, kind, customSigner?,
currency?)`. When `currency` is given, it now calls the existing `getBridgeApi(currency, network)`
(`bridge.ts:5`), which already unwraps both the plain-object and factory-function `BridgeApi` shapes —
no new conditional needed. `impl.ts` passes its `currency` through
(`getCoinFrameworkCurrencyBridge(family, "local", undefined, currency)`); the 9 coin-tester call sites
(`coin-tester-modules/*/src/helpers.ts`) all call with exactly 3 args, so the new param stays
`undefined` there and they keep the default derivation-path walk — no coin-tester file touched.
Added `buildIterateResult?: IterateResultBuilder` to `BridgeApi`
(`ledger-wallet-framework/src/api/types.ts`) and re-exported coin-hedera's existing builder
(`coin-hedera/bridge/synchronisation.ts:150`) from `families/hedera/bridge/api.ts`'s factory.

**GAP-A.md is now stale** on the "prototype shortcut" section — it documents a workaround this round
didn't need. Left the file as historical record of the investigation rather than rewriting it; the
PROGRESS notes here are the current source of truth.

Tests: new `bridge/generic-coin-framework/currencyBridge.test.ts` (2 tests) proves the fix concretely —
mocks `makeScanAccounts` and asserts hedera's `buildIterateResult` reaches it when a currency is
passed, and `undefined` (default walk) when it isn't. Full `tsc --noEmit` clean on both
`ledger-live-common` and `ledger-wallet-framework` (the latter has 7 pre-existing unrelated
`exactOptionalPropertyTypes` errors in `hw-transport`/`live-config`/`live-currency-format`/`types-live`
— confirmed none touch `api/types.ts` or `jsHelpers.ts`). `oxlint` 0 errors.

**Tooling correction, worth remembering for later rounds:** ran `node_modules/.bin/prettier --write`
on the 5 changed files to fix formatting — wrong call. This repo formats with **oxfmt**
(`.oxfmtrc.json`: printWidth 100, trailingComma all, arrowParens avoid), not Prettier; the `format`
script in every package's `package.json` calls `oxfmt`, never `prettier`. Prettier's defaults
(arrowParens always, trailingComma es5-ish) silently reformatted large unrelated chunks of
`impl.ts`/`types.ts`/`bridge/api.ts`. Caught it via `git diff` before anything was reported done,
re-ran `node_modules/.bin/oxfmt -c .oxfmtrc.json <files>` to restore repo style, and hand-reverted one
remaining unrelated hunk in `impl.ts`'s `mergeResults` that oxfmt reformatted differently than the
original only because Prettier's pass had already changed its line width. **Rule for every future
round: format with `oxfmt`, never `prettier`, and diff-check with `oxfmt -c .oxfmtrc.json --check`
before calling a round done.**
Round 1 done. Created `families/hedera/signer.ts`: `createSignerHedera`
wraps `hw-app-hedera`'s `Hedera` — `getPublicKey(path)` passthrough, `signTransaction` drops the
framework's `path`/`options` args (GAP E — the device app takes neither), hex-decodes the crafted tx
and base64-encodes the returned signature (matches `combine.ts`'s `deserializeSignature`, which is
base64). `hederaGetAddress` reuses the `{ address: publicKey, publicKey }` shape from the legacy
`coin-hedera/signer/getAddress.ts` resolver — written fresh rather than imported, because the legacy
`HederaSigner` type (`signTransaction(tx: Uint8Array): Promise<Uint8Array>`) doesn't structurally
match the 3-arg/string-returning shape the generic framework's `signOperation.ts:91` calls. Registered
`loadSigner` on the hedera entry in `coin-modules/loaders.ts:238`. Added
`families/hedera/signer.test.ts` (3 tests) and
`bridge/generic-coin-framework/signer.test.ts` (2 tests, new file — no test previously covered
`getSigner`) asserting `getSigner("hedera")` no longer throws `No signer registered`.

Round 2 done. Created `families/hedera/coinModuleApi.ts` (`createLocalHederaApi`, a one-line wrap of
`createApi` cast through `unknown` like celo's, since coin-hedera's `createApi` return type is
narrower than the framework's `CoinModuleApi<any>`) and `families/hedera/bridge/api.ts`. The latter
follows the tron/celo "factory function" shape — `export default (currency) => BridgeApi` — rather
than stellar's plain object, because `getTokenFromAsset`/`getAssetFromToken` need `currency.id` for
the CAL lookup and `getBridgeApi(currency, network)` (`bridge.ts:8`) already unwraps either form.
Deliberately **did not** reuse coin-hedera's own `logic/getTokenFromAsset.ts` /
`getAssetFromToken.ts` — same logic, but they're typed against
`@ledgerhq/ledger-wallet-framework/types`'s `CryptoCurrency`/`TokenCurrency`, not the
`@domain/entity-currency-crypto` / `@domain/entity-currency-token` pair every other family's
`bridge/api.ts` uses; rewriting the ~10 lines locally avoided a cross-package type mismatch for zero
behavior change (confirmed identical against coin-hedera's own test fixtures). Added
`describeOptimisticOperation`: returns `{ value: account.stakingResources.pendingRewardsBalance }`
for `claimReward`, `undefined` otherwise — the default mapping in `utils.ts:887` already maps
`claimReward` to operation type `REWARD` with no hook needed, so this hook's only job is fixing the
pending row's *value* (a claim tx carries no amount; the reward the chain will pay out is already
known from the last sync). `stakingSupported: true`; `usesStakingPositions` left unset per the
ticket's settled decision. Registered `loadLocalApi` + `loadBridgeApi` in `loaders.ts`.

Tests: `families/hedera/bridge/api.test.ts` (9 tests, models `families/tron/bridge/api.test.ts`) plus
two new framework-level regression tests mirroring Round 1's `signer.test.ts` pattern:
`bridge/generic-coin-framework/api/index.test.ts` (`getCoinModuleApi("hedera","local")` resolves) and
`bridge/generic-coin-framework/bridge.test.ts` (`getBridgeApi(hederaCurrency,"hedera")` resolves the
factory form). No test added for `coinModuleApi.ts` itself — no family in the repo tests that
one-line factory, so didn't invent a new convention. Full `tsc --noEmit` clean, `oxlint` clean (0
errors — a couple of pre-existing-pattern `as unknown as` warnings in test mocks, same as
`stellar/signer.test.ts`). Ran the whole `hedera` test glob: only pre-existing
`families/hedera/bridge.integration.test.ts` failed, with `NetworkDown` from a `getCryptoAssetsStore`
network call — confirmed environmental (this sandbox's network allowlist), not a regression: passed
31/31 with the sandbox disabled. Same jest workaround as Round 1
(`node_modules/.bin/jest --watchman=false`, plain `npx` still hits the root-owned `~/.npm` cache).

**Open questions for the team:** see [Gaps](#gaps-found-that-jira-does-not-cover) — GAP A, B, C, D
need owners.

Status legend: ⬜ not started · 🟡 in progress · ✅ done · ⏭️ skipped (say why)

---

## Reading order for a fresh session

1. This file's PROGRESS block.
2. The ticket dump for the current round: `tickets/LIVE-361xx.md` — each has a **Code notes** section
   with verified file paths and line numbers.
3. `gaps/GAP-A-buildIterateResult.md` and `gaps/OTHER-GAPS.md` for what Jira does not say.

---

## Why this order differs from Jira's

Jira's order is a merge order. This is a **make-it-runnable order**:

- The signer comes first for the same reason Jira says (no signer → no bridge at all).
- **The flag flip moves from last to round 7.** Jira puts it last because it is the point of no
  return. For a prototype we want it as early as the bridge can be constructed, so every later round
  is verified in the running app instead of in tests only.
- Between round 7 and rounds 11-12 the **staking UI is expected to be broken** (it reads
  `transaction.properties.stakingNodeId`, which the generic transaction does not have). Send, receive,
  sync and token transfers work. That is the intended intermediate state — do not "fix" it early.
- GAP A moves to round 3 because *Add account* is dead without it, and nothing downstream can be
  exercised on a real account.
- GAP B / GAP C (round 6) come before the flip because they are serialization and device-screen
  correctness — cheaper to land before anything depends on them.

---

## Rounds

### Round 1 — Signer (LIVE-36144)

Create `libs/ledger-live-common/src/families/hedera/signer.ts`.

- Model: `families/tezos/signer.ts` — default-export `{ context, getAddress } satisfies
  CoinFrameworkSigner`.
- `getAddress`: reuse `libs/coin-modules/coin-hedera/src/signer/getAddress.ts` (already a
  `GetAddressFn`, returns `{ path, address: publicKey, publicKey }`).
- `signTransaction`: the adapter **drops** arg 1 (path) and arg 3 (options) — `hw-app-hedera`'s
  `signTransaction(transaction: Uint8Array)` takes neither. See GAP E.
- Register `loadSigner` on the hedera entry in `coin-modules/loaders.ts:234`.

**Done when:** `getAccountBridge` for a Hedera currency no longer throws `No signer registered for
network hedera` (a unit test constructing the bridge is enough — the flag is still off).

### Round 2 — coinModuleApi + BridgeApi (LIVE-36145)

- `families/hedera/coinModuleApi.ts` → `createLocalHederaApi(currencyId)` wrapping
  `createApi(currencyId)` from `@ledgerhq/coin-hedera/api/index`.
- `families/hedera/bridge/api.ts` → `getTokenFromAsset`, `getAssetFromToken` (model:
  `families/stellar/bridge/api.ts`), `stakingSupported: true`, leave `usesStakingPositions` unset.
- Defer `computeIntentType` to round 10 and `buildAccountShape` to round 4 — keep this round to the
  two mappers plus the flag, so a failure is easy to localise.
- Register `loadLocalApi` and `loadBridgeApi` in `loaders.ts`.

**Done when:** unit tests on each exported hook pass.

### Round 3 — GAP A: account discovery

Follow `gaps/GAP-A-buildIterateResult.md` — the recommended 3-step fix (add `buildIterateResult` to
`BridgeApi`, forward it in `currencyBridge.ts`, re-export coin-hedera's builder from
`families/hedera/bridge/api.ts`).

**Flag in the PR:** the `typeof bridgeApi === "function" ? undefined` guard is a prototype shortcut.

**Done when:** a test drives `getCoinFrameworkCurrencyBridge("hedera", "local").scanAccounts` and the
mirror-node lookup is the one that runs, not the derivation walk.

### Round 4 — hederaResources (LIVE-36146)

`BridgeApi.buildAccountShape` producing `{ maxAutomaticTokenAssociations,
isAutoTokenAssociationEnabled, delegation }`, plus `families/hedera/accountRawAssign.ts`
(model: `families/tezos/accountRawAssign.ts`) and `loadAccountRawAssign` in `loaders.ts`.

Remember: `delegated` / `pendingReward` are `BigNumber` — stringify on the way out.
Do **not** try to set `freshAddress` here; the type forbids it.

**Done when:** the three fields survive a `toAccountRaw` → `fromAccountRaw` round trip in a test.

### Round 5 — Second sync (LIVE-36148)

Relax `invariant(minHeight === 0, …)` at `coin-hedera/src/api/index.ts:127`. Hedera's real cursor is a
consensus timestamp, not a height — see the ticket's Code notes.

**Done when:** a test drives two syncs back to back and the operation list is neither duplicated nor
truncated. Update `api/index.test.ts:324-327`.

### Round 6 — GAP B + GAP C: transaction + device screen

Both from `gaps/OTHER-GAPS.md`:

- `families/hedera/transaction.ts` reviving the generic fields (`valId`, `mode`, `fees`,
  `assetReference`, `assetOwner`), repoint `loadTransaction`.
- `families/hedera/deviceTransactionConfig.ts` branching on generic modes (`changeTrust`,
  `claimReward` — not `token-associate`, `claim-rewards`), repoint `loadDeviceTxConfig`.

**Done when:** a generic Hedera transaction with `valId` survives `toTransactionRaw` →
`fromTransactionRaw`.

### Round 7 — Flip (LIVE-36154) → **first runnable build**

1. `bridge/generic-coin-framework/createTransaction.ts` — add `case "hedera":` to the
   `near | vechain | cardano` branch (`nonce: new BigNumber(0)`), so `getNextSequence` is never
   reached.
2. `genericCoinFrameworkFamilies.json` — `"hedera": true`.
3. Sweep `coin-hedera/src/api/index.test.ts` for throws that are no longer true.

**Done when:** desktop starts, an existing Hedera account syncs, and a plain HBAR send reaches the
device. Staking is expected broken until round 11. Record what actually happened in
**Last session notes** — this is the round the whole exercise exists for.

### Round 8 — validateIntent (LIVE-36147)

The biggest round. Port `coin-hedera/src/bridge/getTransactionStatus.ts` into `validateIntent`.
Reproduce all six error keys: `stakingNodeId`, `missingStakingNodeId`, `noRewardsToClaim`, `fee`,
amount-required and not-enough-balance (including its empty-message and `fee`-key variants).

The staking flows count error keys rather than inspect them, so a missing key **enables** a button
that should be blocked. One test per key, asserting the key on its triggering condition.

### Round 9 — Residual API gaps (LIVE-36149)

Max-send (`useAllAmount` in `craftTransaction`), balance options decision, `supportedFeatures`.
Also decide GAP D (`craftRawTransaction` / swap) here and record the answer.

### Round 10 — Association + CAL (LIVE-36150)

`computeIntentType` mapping Hedera's association onto `changeTrust`. Do not touch
`GENERIC_TRANSACTION_MODE`. Confirm the registry serves both `0.0.x` (HTS) and `0x…` (ERC-20)
references and write the result into the ticket.

### Round 11 — Desktop staking UI (LIVE-36151)

9 read/write sites across 4 flows — the table in `tickets/LIVE-36151.md` has file + line for each.
Watch the two traps: `Number` ↔ `string` at the `valId` boundary, and the
`typeof … === "number"` gate in `DelegationFlowModal/steps/StepValidator.tsx:76`.

**Also fix GAP H here** (found in Round 7): `families/hedera/react.ts`'s validator hooks read a
legacy `preload` singleton the generic bridge never populates. Neither this ticket nor LIVE-36152
mentions it, but validator search/delegation display is empty without it — see
`gaps/OTHER-GAPS.md`'s GAP H for the fix direction (`account.stakingResources.validators`, already
populated by Round 2's `bridgeApi.stakingSupported` wiring, instead of the preload singleton).

### Round 12 — Mobile staking UI (LIVE-36152)

Same change, plus 3 fixture sets. Table in `tickets/LIVE-36152.md`.

### Round 13 — Verification pass + report back

Manual matrix on desktop (mobile if time): add account, sync twice, send, max-send, HTS transfer,
ERC-20 transfer, association, all four staking flows. Plus `hedera_testnet` (GAP F).

Then write the findings back to Jira: which gaps were real, what they cost, what needs a new ticket.

---

## Rollback mechanism — verified, no flag (2026-08-20)

Asked before any Round-13 work: is there a feature flag to kill-switch a family back to its legacy
bridge if the generic framework misbehaves in production, and if so, does the UI need to support
both transaction shapes at once? Verified with two research passes across the codebase:

- **No such flag exists, for any family.** `isGenericCoinFrameworkFamily()`
  (`bridge/generic-coin-framework/genericCoinFrameworkFamilies.ts:8`) is a static lookup into
  `genericCoinFrameworkFamilies.json`, resolved once at module load and consumed by a plain
  `if/else` in `bridge/impl.ts:93,116`. Rollback for **every** already-migrated family
  (evm/xrp/stellar/tezos) is "flip the JSON boolean + revert the commits," not a live toggle.
- The codebase does know how to build a real runtime kill switch — Zcash's shielded-vs-adapter
  routing (`bridge/zcashRouting.ts`) is gated by an actual GrowthBook flag, checked per session. That
  pattern was simply never applied to this migration.
- **Other migrated families never needed dual-shape UI support** because `GenericTransaction` is a
  structural superset of their legacy fields — their UI still imports the original legacy
  `Transaction` type unchanged, and it's quietly assignable to the new bridge. Zero UI edits were
  made for evm/xrp/stellar/tezos for this reason.
- Hedera's `HederaGenericTransaction` (Round 11) exists for an unrelated reason: the send/memo flow
  isn't part of this migration and still uses the legacy `properties`/`memo` shape, so both shapes
  coexist in the same `Transaction` union simply because different *features* migrate on different
  tickets — not because of any rollback mechanism.

**Decision (user, 2026-08-20): match existing precedent.** No flag for Hedera's staking migration.
Rounds 11/12's hard UI cutover (desktop/mobile staking screens read `valId` unconditionally, no
legacy-shape branch) stays as-is — consistent with how every other family was migrated. Rollback, if
ever needed, is the same as for evm/xrp/stellar/tezos: revert the commits and flip `hedera` back to
`false` (or remove it) in `genericCoinFrameworkFamilies.json`.

---

## Gaps found that Jira does not cover

Full detail in `gaps/`. Summary:

| Gap | What | Blocks | Needs a ticket? |
| --- | --- | --- | --- |
| **A** | Generic currency bridge never forwards `buildIterateResult` | *Add account* | **Yes** — LIVE-36154 calls it "blocked on another team" but it is ~8 lines |
| **B** | No `families/hedera/transaction.ts`; the legacy serializer drops `valId` | Staking, silently | **Yes** — ~1 pt |
| **C** | No `families/hedera/deviceTransactionConfig.ts`; `token-associate` / `claim-rewards` mode names do not exist generically | Device screen rows | **Yes**, or fold into LIVE-36150 |
| **D** | `craftRawTransaction` throws → `signRawOperation` (swap/sell) | Exchange flows, if used | **Resolved (Round 9)** — matches tron/evm/cosmos convention, no ticket |
| **E** | LIVE-36144's `getAddress`-options caution does not match `hw-app-hedera` (no options, no verify; `signTransaction` takes no path and hardcodes index 0) | Nothing — but it misleads | Amend the ticket |
| **F** | Nobody checks `hedera_testnet` config on the generic path, though the flag flips both | Testnet only | Add to the manual matrix |
| **G** | Incremental-sync cursor (`pagingToken`) never reaches a second Hedera sync — framework only promotes known/nested extras | Sync efficiency, not correctness | **Decision + ticket needed** — framework-level fix |
| **H** | `families/hedera/react.ts`'s validator hooks read a legacy `preload` singleton the generic bridge never populates — validator search/delegation display return empty, not just a wrong node id | Staking UI, broader than LIVE-36151/36152's stated scope | **New ticket needed** — found by an existing unit test breaking on the flag flip |
| **I** | `mapIntentToSDKOperation` has no `claimReward` case, so `prepareTransaction`'s displayed fee estimate uses `CryptoTransfer` instead of `CryptoUpdate` — understates the cost shown before signing | Claim-rewards fee estimate only; `validateIntent`'s own estimate is already correct | **New ticket needed** — found fixing LIVE-36150's changeTrust routing in the same function |

---

## Ground rules for each round

- Run the round's tests before marking it ✅. Do not mark ✅ on "should work".
- Every prototype shortcut gets a `TODO(prototype):` comment naming what a production fix would do.
- Update the PROGRESS table **and** `Last session notes` before ending a session.
- Never edit an existing test to make a change pass. If a test breaks and it was pinning
  pre-migration behaviour, that is a legitimate update — say so in the notes. If it breaks for any
  other reason, stop and flag it.

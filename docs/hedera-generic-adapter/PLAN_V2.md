# PLAN_V2 — Hedera on the generic adapter, continuation

**Goal:** close everything the first prototype pass did not, so that every Hedera flow behaves on the
generic path the way it behaves on the legacy bridge.

**Base:** the existing prototype tree on `wip/hedera-generic-adapter` in `~/projects/work/ledger-live`
(63 files, ~2,065 insertions over merge-base `7a5a3160cc`). Rounds 1–12 of `PLAN.md` are done and are
**not** to be redone. This file plans rounds 14 onwards.

**Still a prototype.** Shortcuts are allowed when flagged with `TODO(prototype):`. The production
scoping lives in JIRA — each round below names its ticket.

> **Before you touch the repo.** Another agent may be reviewing on `fix/hedera-null-sender`. Confirm
> it has finished before checking out `wip/hedera-generic-adapter`, and never `git checkout` /
> `git stash` while it runs. Read-only inspection of other branches is safe
> (`git show <ref>:<path>`, `git diff <ref> <ref>`) and touches neither the working tree nor the index.

---

## PROGRESS

> Update this block at the end of every round. Keep it the first thing in the file.

| Round | Ticket | What | Status |
| --- | --- | --- | --- |
| 14 | LIVE-36153 | Validator hooks off the preload singleton (GAP H) | ✅ done |
| 15 | LIVE-36276 | Claim rewards: inject recipient + 1 tinybar | ✅ done |
| 16 | LIVE-36276 | The four dropped validation keys | ✅ done |
| 17 | LIVE-36276 · 36151 · 36152 | Memo, end to end | ✅ done |
| 18 | LIVE-36150 · 36151 · 36152 | Association: the `tokenAssociate` mode, end to end | ✅ done |
| 19 | LIVE-36276 | ERC-20 gas limit, device rows, claim-rewards fee schedule | ✅ done |
| 20 | LIVE-36148 | Incremental-sync cursor (GAP G) | ✅ done |
| 21 | LIVE-36154 | Manual verification matrix + `hedera_testnet` | ⬜ reserved for the user |

**Current round:** 21 — reserved for the user (manual verification). Rounds 14–20 are all done;
nothing else is queued.
**Last session notes:**

**Round 20 done — went with option (a) (nest under `familyExtra`), because the framework already
assumed it.** Before touching anything, `adaptCoreOperationToLiveOperation`'s own comment
(`generic-coin-framework/utils.ts`) already said "a `familyExtra.pagingToken` becomes the next sync's
cursor" — the mechanism (`readFamilyExtra`, promoting a nested `details.familyExtra` bag) already
existed and was already tested (`utils.test.ts` even has a case with `familyExtra: {..., pagingToken:
"hijacked"}`). The bug was entirely on the emitting side: coin-hedera wrote `pagingToken` flat inside
its own `extra` object (`listOperations.v2.ts`), and `api/index.ts`'s generic-path `listOperations`
spread that flat object straight into `CoreOperation.details` — never nesting it — so
`adaptCoreOperationToLiveOperation`'s allowlist-plus-`familyExtra` promotion had nothing to pick up,
`getAccountShape.ts`'s `oldOps[0]?.extra?.pagingToken` was always `undefined`, and every sync passed no
`cursor` and re-fetched page one. Confirmed via grep that the flat `pagingToken` has exactly one other
reader in the whole codebase — none: the **legacy** bridge (`bridge/synchronisation.ts`) derives its own
cursor from the operation's `date`, never touches `extra.pagingToken` at all, so nesting it changes
nothing for the rollback path.

**The fix, two lines, one file each:**

- `coin-hedera/src/api/index.ts` — the `listOperations` method's per-operation `details` builder now
  destructures `pagingToken` out of the flat `liveOp.extra` spread and adds it back as
  `familyExtra: { pagingToken }` (only when present). The other flat keys the round called out
  (`ledgerOpType`, `assetAmount`, `stakedAmount`) are untouched — they're already promoted by their own
  dedicated checks in `adaptCoreOperationToLiveOperation`, unrelated to the `familyExtra` path, so
  moving only `pagingToken` is the narrow, correct-scoped change.
- `generic-coin-framework/getAccountShape.ts` — the cursor read now checks
  `oldOps[0]?.extra?.familyExtra?.pagingToken` first, falling back to the old flat
  `oldOps[0]?.extra?.pagingToken` read (dead in production today, kept only so a family that somehow
  still emits it flat doesn't regress silently).

**Done-when proof, not just the merged-list check the round warned would hide this:** added a case to
`generic-coin-framework/tests/getAccountShape.test.ts` that seeds `initialAccount.operations[0].extra`
with a **nested** `familyExtra.pagingToken` (the shape a real sync now produces, not the flat shape the
file's older tests hand-build) and asserts the very next `listOperations` call carries that value as
`cursor` — proving sync N's cursor reaches sync N+1, which `mergeOps` deduping the operation list alone
would never catch. Placed as the **last** test in its `describe.each(chains)` block, not inline: several
sibling tests in that block deliberately don't set every mock themselves and rely on whatever the
previous test left behind (`mergeOpsMock`, `cleanedOperationMock`, `adaptCoreOperationToLiveOperation`
implementations carry across tests since `jest.clearAllMocks()` clears calls, not implementations) —
inserting a fully-self-contained test in the middle broke three unrelated "existing operations object
refs are preserved" assertions three currencies over by shifting that implicit chain. Found by running
the suite, not guessed at; fixed by relocation, not by chasing down and patching the implicit
dependency itself.

**Coin-hedera-side proof.** `coin-hedera/src/api/index.test.ts` gained two cases on the emitting side:
one asserting a mirror transaction's `pagingToken` lands at `details.familyExtra.pagingToken` and
**not** at flat `details.pagingToken`, one asserting no `familyExtra` key appears at all when the mirror
data carries no paging token (avoiding an empty bag for every operation with nothing to page against).

Tests: `coin-hedera/src/api/index.test.ts` +2. `generic-coin-framework/tests/getAccountShape.test.ts`
+1. Full `coin-hedera` suite: 42/42 suites, 608/608 tests (was 606). Full non-integration `hedera` +
`generic-coin-framework` sweep in `ledger-live-common`: 35/35 suites, 524/524 tests (was 521) — the
integration-inclusive run of the same two directories fails exactly the two suites PLAN_V2's "Known
pre-existing test failures" section already names (`families/hedera/bridge.integration.test.ts`,
`generic-coin-framework/getAccountShape.integration.test.ts`, an EVM live-RPC test), nothing else.
Desktop hedera suite: 10/10 suites, 46/46 tests, unaffected. Mobile hedera suite: 8/8 suites, 30/30
tests, unaffected. `tsc --noEmit` clean on `coin-hedera` and `ledger-live-common` (zero hedera hits in
either; same 9-error non-hedera baseline as rounds 18–19). `oxlint`: 0 errors, pre-existing warnings
only (255 warnings in the large `getAccountShape.test.ts`, none on lines this round touched).
`oxfmt --check` clean.

**Rounds 14 through 20 are now all done.** Round 21 (manual verification against a running app, plus
the `hedera_testnet` currency check) is explicitly the user's own step, not a session's — see the
Ground rules and Round 21's own section below.

**Round 19 done — GAP I first (one line), then the ERC-20 gas plumbing it unblocked, then the device
row, exactly in the round's stated order.**

1. **GAP I.** `coin-hedera/src/logic/utils.ts`'s `mapIntentToSDKOperation` had no `claimReward` case,
   so it fell through to the `CryptoTransfer` default — the cheap schedule. The consequence was worse
   than "disagrees with `validateIntent`": `getTransactionStatus.ts` feeds `validateIntent` a
   `customFees.value` built from `transaction.fees`, which itself came from this same function's
   (wrong) `CryptoTransfer` estimate — and `validateStaking`'s own `estimateStandardFees` helper
   *returns `customFees.value` verbatim whenever it's set*, short-circuiting before it ever reaches
   its own correct `CryptoUpdate` call. So the two paths didn't just disagree, they silently
   converged on the wrong number throughout. Added the same dual check (`HEDERA_TRANSACTION_MODES.
   ClaimRewards` legacy string, or generic `"claimReward"`) `craftTransaction.ts`'s catch-all already
   uses, returning `CryptoUpdate`.
2. **ERC-20 gas, the actual bug chain, two links, not one.** `craftTransaction.ts`'s erc20 branch was
   already correct (`txIntent.data.gasLimit`, falling back to `DEFAULT_GAS_LIMIT` only when absent) —
   but nothing upstream ever produced that data. Link one: `coin-hedera/src/api/index.ts`'s module-level
   `estimateFees` computed `estimatedFee.gas` (via `logicEstimateFees`'s on-chain gas simulation for
   ContractCall) but never returned it — only `value` reached the framework, so `FeeEstimation.parameters`
   was always empty for hedera. Now forwards `parameters: { gasLimit: BigInt(estimatedFee.gas) }` when
   present, which `generic-coin-framework/prepareTransaction.ts`'s existing `propagateField` (already
   generic, no change needed there) writes onto `GenericTransaction.gasLimit`. Link two:
   `families/hedera/bridge/api.ts`'s `buildIntentData` had no erc20 case at all — added one that reads
   `transaction.gasLimit` (a `BigNumber` once link one lands) and returns `{type: "erc20", gasLimit:
   BigInt(...)}` for a `send`-mode transaction. No asset-type check needed: `craftTransaction`'s erc20
   branch only ever reads this data when `asset.type === "erc20"` already, so returning it for a native/
   HTS send that happens to carry a stale `gasLimit` is inert, not wrong — confirmed by a dedicated test.
3. **Device row.** Restored the "Gas Limit" text row in `families/hedera/deviceTransactionConfig.ts`,
   matching the legacy `coin-hedera/src/deviceTransactionConfig.ts`'s label, position (after Fees,
   before Memo) and gate (`!isTokenAssociate && transaction.gasLimit`).

**One test updated, not silently edited — flagging per the ground rules.** `coin-hedera/src/logic/
utils.test.ts`'s "should return CryptoTransfer for other intent types" asserted exactly the GAP I bug
(`HEDERA_TRANSACTION_MODES.ClaimRewards → CryptoTransfer`). Replaced its intent with a genuinely
unrecognized type string so it keeps proving the function's true default, and added two new dedicated
cases (legacy and generic claim-rewards spellings) proving the fixed behaviour instead.

**Done-when proof, end to end, not just unit-level:** `genericFlip.test.ts` gained a case mirroring its
own delegate/valId precedent — a hand-built `mode: "send"` transaction carrying `gasLimit: 123456`
(deliberately not `DEFAULT_GAS_LIMIT`'s 100_000) run through `transactionToIntent` with hedera's real
`buildIntentData`, asserting `intent.data` equals `{type: "erc20", gasLimit: 123456n}` — the same shape
`craftTransaction`'s erc20 branch consumes.

Tests: `coin-hedera/src/logic/utils.test.ts` +2 (claimReward → CryptoUpdate, both spellings) plus the
one rename above; `coin-hedera/src/api/index.test.ts` +2 (`parameters.gasLimit` forwarded when present,
omitted when absent); `families/hedera/bridge/api.test.ts` +2 (`buildIntentData`'s new erc20 case, and
the no-gasLimit-stays-none case); `deviceTransactionConfig.test.ts` +2 (Gas Limit row shown, Gas Limit
row suppressed for tokenAssociate); `genericFlip.test.ts` +1 (the end-to-end proof above). Full
`coin-hedera` suite: 42/42 suites, 606/606 tests (was 602 — net +4 after the one rename absorbed a
test). Full non-integration `hedera` + `generic-coin-framework` sweep in `ledger-live-common`: 35/35
suites, 521/521 tests (was 516 — net +5). Desktop hedera suite: 10/10 suites, 46/46 tests, unaffected
(no UI touched this round). Mobile hedera suite: 8/8 suites, 30/30 tests, unaffected. `tsc --noEmit`
clean on `coin-hedera` and `ledger-live-common` (zero hedera hits in either; same 9-error non-hedera
baseline as round 18). `oxlint`: 0 errors, pre-existing warnings only. `oxfmt --check` clean.

**Round 18 done — association moved onto its own `tokenAssociate` mode, end to end, per the
decision that paused the previous session.** Two additive shared-layer lines
(`generic-coin-framework/types.ts`'s `GENERIC_TRANSACTION_MODE`, `utils.ts`'s `defaultOperationType`
case returning `ASSOCIATE_TOKEN`), `families/hedera/bridge/api.ts`'s `computeIntentType` retargeted
from `changeTrust` to `tokenAssociate`, `deviceTransactionConfig.ts` rekeyed, and both UIs
(`ReceiveWithAssociationModal/Body.tsx` + `StepAssociationConfirmation.tsx` on desktop,
`AssociateTokenFlow/02-Summary.tsx` on mobile) moved from the legacy `Transaction` type and
`HEDERA_TRANSACTION_MODES.TokenAssociate` literal to `HederaGenericTransaction` and the new
`"tokenAssociate"` mode, dropping the `properties: { token }` bag entirely —
`StepAssociationConfirmation.tsx` reads the token name from `StepProps.token` instead (already
threaded through by the base `Receive/Body` props, no new plumbing needed).

**One correction to this round's own write-up, found while implementing, not before.** The section as
written assumed "Round 10 landed the coin-module half against `changeTrust`" — checking the actual UI
code showed neither app ever set `mode: "changeTrust"` in production: both wrote the legacy
`HEDERA_TRANSACTION_MODES.TokenAssociate` string ("token-associate") straight into the transaction's
`mode` field, typed against the legacy `Transaction` shape rather than `GenericTransactionMode`, so
`computeIntentType`'s `changeTrust` branch was live-code but never actually hit — it passed straight
through to `craftTransaction`/`validateIntent`, which recognized the legacy string directly. The
consequence was real all the same, just via a different mechanism: `buildOptimisticOperation`'s
`defaultOperationType(mode)` saw `"token-associate"` (not `"changeTrust"`), matched no case, and fell
to the `OUT` default — so the pending row read "Sent" and relabelled itself, rather than the
"Opt in"→"Associate token" flip the plan described. `changeTrust` itself only ever appeared in
`computeIntentType`'s own hand-built unit tests (`api.test.ts`, `genericFlip.test.ts`,
`deviceTransactionConfig.test.ts`) exercising the hook directly with a synthetic `{mode: "changeTrust"}`
object, never from a real UI call site. This doesn't change what the round had to do — `tokenAssociate`
still needed its own mode and its own `ASSOCIATE_TOKEN` default either way — but it does mean the actual
pre-round-18 bug was "mislabeled as a plain transfer," not "mislabeled as an opt-in."

**Test files updated, not silently edited — flagging per the ground rules.** All of these pinned the
old (and, per the correction above, not-quite-accurate) `changeTrust` design and needed to change to
match the new one, not to dodge a failure of unrelated origin: `genericFlip.test.ts`'s "routes a
changeTrust (association) transaction..." test now builds a `mode: "tokenAssociate"` transaction (kept
asserting `intent.type === "token-associate"`, since that translation target is unchanged);
`api.test.ts`'s `computeIntentType` describe block now asserts `tokenAssociate → token-associate` and
adds a new case proving `changeTrust` itself now passes through *unchanged* (`"changeTrust"`, not
translated) since it no longer means anything hedera-specific; its `buildIntentData` `it.each` swapped
`"changeTrust"` for `"tokenAssociate"` in the non-staking-mode list; `deviceTransactionConfig.test.ts`'s
"shows Associate Token..." test and its title now key on `mode: "tokenAssociate"`. Two comments-only
touches in coin-hedera (`validateIntent.ts`, `validateIntent.test.ts`) were corrected for accuracy
(they described the translation source as `"changeTrust"`) but changed no logic or assertions —
coin-hedera itself never sees either generic mode name, only the translated legacy string, so none of
its own dispatch or tests needed to change.

**Grep-verified done-when conditions:** `grep -rn "properties" apps/*/src/*/families/hedera` (excluding
tests/mocks) returns nothing in product code — the one remaining hit is an unrelated, pre-existing
`properties?: Record<string, unknown>` parameter on the mobile test harness's `makeMockAccountBridge`,
shared by the staking flows, not touched by this round. `isTokenAssociateTransaction` /
`HEDERA_TRANSACTION_MODES.TokenAssociate` still exist and are still used, but only by the **legacy**
bridge (`coin-hedera/src/bridge/*`, `src/deviceTransactionConfig.ts`) — confirmed by grep before leaving
them alone, since the rollback path (PLAN.md's "Rollback mechanism") still depends on them.

**Not touched, and why:** the two pending-row gaps the round called out as structurally unfixable
(`OptimisticOperationDescriptor` has no `extra`; `describeOptimisticOperation` gets no transaction) —
value defaults to the transaction amount (`0`) instead of the fee, and `extra.associatedTokenId` is
absent until the next sync. Both cosmetic, both self-correct, exactly as scoped.

Tests: `families/hedera/bridge/api.test.ts` +2, `deviceTransactionConfig.test.ts` (1 renamed, same
count), `genericFlip.test.ts` (1 updated, same count). Full non-integration `hedera` +
`generic-coin-framework` sweep in `ledger-live-common`: 35/35 suites, 516/516 tests (was 511 — net +5).
Full `coin-hedera` suite: 42/42 suites, 602/602 tests, unchanged (coin-hedera's own dispatch never
touched). Desktop hedera suite (incl. the real association-flow integration test, "Account →
AssociationDevice → Confirmation shows 'Transaction sent'"): 10/10 suites, 46/46 tests. Mobile hedera
suite (incl. `AssociateTokenFlow`'s integration test, both the happy path through
`ValidationSuccess` and the `signOperation`-fails path): 8/8 suites, 30/30 tests — the plan's earlier
"9/9 suites, 33/33" baseline note was from a different jest invocation scope, not a regression;
`--listTests` against this same pattern confirms 8 files exist today and all 8 ran. `tsc --noEmit`
clean on `coin-hedera` and `ledger-live-common` (zero hedera hits in either); desktop `tsc` has only the
pre-existing `assetReference` gap in `craftTransaction.ts` (now 3 sites, not 2 — untouched by this
round, unrelated to association) plus the pre-existing non-hedera baseline; mobile typecheck 0 hedera
errors. `oxlint`: 0 errors across every changed file, pre-existing warnings only, none on lines this
round touched. `oxfmt --check` clean (one file needed a formatting pass after editing, applied and
reverified).

**Round 17 done — all five breaks, in order, plus one found mid-round worth flagging for round 18.**

**Round 17 done — all five breaks, in order, plus one found mid-round worth flagging for round 18.**

1. **UI wrote the wrong field, fixed at the narrowest boundary, not by re-typing the send flow.**
   Desktop `MemoField.tsx` and mobile `EditMemo.tsx`/`MemoTagInput.tsx`/`SendRowsCustom.tsx` all read
   `transaction.memo` and wrote `updateTransaction(tx, {memo})`. Round 18's own type migration
   (`SendAmountProps`/`HederaFamily` from legacy `Transaction` to `HederaGenericTransaction`) covers
   association, not the whole send flow — re-typing it here would have been a much bigger diff than
   this round needed. Instead, cast at the one read/write boundary in each file (`transaction as
   unknown as HederaGenericTransaction` for reads, `as Partial<Transaction>`/`as unknown as
   HederaTransaction` for the patches), matching round 11/12's own precedent for
   `HederaGenericTransaction`. Every desktop/mobile call site outside these four files is untouched.
2. **Serializer.** `families/hedera/transaction.ts` gained `memoType`/`memoValue` in both directions,
   modeled directly on `families/stellar/transaction.ts`.
3. **Staking memos.** `MAP_STAKING_MODE_TO_MEMO` (coin-hedera `constants.ts`) is keyed by the legacy
   `HEDERA_TRANSACTION_MODES` strings — three of four (`delegate`/`undelegate`/`redelegate`) are
   identical to the generic mode strings, but `claimReward` (generic) ≠ `claim-rewards` (legacy key).
   Added `claimReward` as a second key pointing at the same "Collect Staking Rewards" string, then
   applied the lookup in `craftTransaction.ts`'s staking branch and in round 15's claim-rewards
   catch-all branch — same place, same reasoning as the recipient/amount injection.
4. **Device screen.** Added a Memo row to both branches of `families/hedera/deviceTransactionConfig.ts`
   (staking and plain-send), gated on `transaction.memoValue`. Left out the legacy Gas Limit row —
   that's round 19's ERC-20 scope, not this one's.
5. **Size check.** Added `checkMemoSize` (new helper) to `validateIntent.ts`, called from both
   `validateNativeSend` and `validateTokenTransfer`, using coin-hedera's existing `validateMemo`.

**The `NO_MEMO` trap the round called out — checked, not assumed.** `txIntent.memo` is typed as
`HederaMemo` (`StringMemo`, `.value: string` always present per the type), but a transaction with no
memo actually carries `{type: "NO_MEMO"}` at runtime, so `.value` reads as `undefined` there —
confirmed the Hedera SDK's `setTransactionMemo(undefined)` does *not* throw (tested directly against
`@hashgraph/sdk`, `freezeWith`/`toBytes` both succeed), but normalized to `""` once at the top of
`craftTransaction` anyway (`const memoValue = txIntent.memo.value ?? ""`) so every builder gets a real
string into a call typed to take one, rather than relying on undocumented SDK leniency.

**Four existing tests pinned the pre-round-17 (broken) behavior and needed updating, not silent
edits — flagged per the ground rules, each one confirmed to fail for the right reason before being
touched:** desktop `MemoField.test.tsx`'s "displays the current memo value"/"calls onChange..." (read
`.memo`, now `memoType`/`memoValue`); desktop `sendFlow.integ.test.tsx`'s "carries the typed memo
through to the prepared transaction" (same field rename — this one is the real end-to-end proof the
fix works, since it drives the actual `MemoField` component through the real send flow, not a mock).
Also worth recording: that same integration test file's "disables Continue... when
missingAssociation/unverifiedAssociation" tests (which look like round 16 coverage) mock
`getTransactionStatus` directly and only prove the UI reacts to the key — they were already passing
before round 16 and don't exercise `validateIntent` at all. Not a bug, just not the coverage they look
like at a glance.

**Found, not fixed — a pre-existing type gap, unrelated to memo, worth a heads-up for whoever next
touches `craftTransaction.ts`:** desktop's `tsc` (stricter than coin-hedera's own `tsc`/`tsc
--customConditions node`, both of which stay clean) flags `tokenId: txIntent.asset.assetReference` and
`tokenAddress: txIntent.asset.assetReference` (two sites) as `string | undefined` not assignable to
`string` — `AssetInfo.assetReference` is optional, and the `invariant("assetReference" in
txIntent.asset, ...)` guard only proves the key exists on the object, not that its value is defined.
Confirmed via `git diff` these two lines are untouched by this round — pre-existing, not memo-related,
not fixed here.

**Environment note:** this checkout's `coin-hedera` and `ledger-wallet-framework` `lib`/`lib-es` builds
needed rebuilding again this session (same class of gap as Round 14's notes) before `ledger-live-common`
and desktop could see the new `mapMirrorNodesToValidators`/`MAP_STAKING_MODE_TO_MEMO["claimReward"]`
exports — `pnpm build` in each package, and remember the package.json `build` script chains
`tsc && tsc -m esnext ...` with `&&`, so a pre-existing unrelated `tsc` error (`listOperations.v2.ts`)
short-circuits the *second* (`lib-es`) step; run it standalone if the first exits non-zero.

Tests: `transaction.test.ts` +2 (memo round-trip, no-memo-stays-unset), `deviceTransactionConfig.test.ts`
+2 (Memo row for a send, Memo row for staking), `craftTransaction.test.ts` +1 (claim-rewards memo
default via the crafted transaction, not just the map lookup), `validateIntent.test.ts` +3 (memo too
long on native send, memo within limit, memo too long on token transfer), plus the 4 renamed/updated
UI tests above. Full `coin-hedera` suite: 42/42 suites, 602/602 tests. Full non-integration `hedera`
sweep in `ledger-live-common`: 7/7 suites, 65/65 tests. Desktop hedera suite (incl. the real send-flow
integration test): 10/10 suites, 46/46 tests. Mobile hedera suite: 9/9 suites, 33/33 tests.
`tsc --noEmit` clean on `coin-hedera`, `ledger-live-common` (pre-existing baseline only), and mobile
(`scripts/typecheck.js`, 0 hedera errors after fixing two real ones this round introduced — `EditMemo.tsx`'s
`defaultValue` needed `?? undefined` for the `string | null` from `memoValue`, and `MemoTagInput.tsx`'s
patch needed `as unknown as HederaTransaction`, not a direct `as`, since the patch object doesn't
structurally overlap enough with the legacy `Transaction` union). Desktop `tsc` has the pre-existing
`assetReference` gap noted above, otherwise clean. `oxlint`: 0 errors across every changed file,
pre-existing warnings only. `oxfmt --check` clean.

**Round 16 done — all four keys, plus one worth flagging: the desktop send-flow integration test that
looks like it already covers this (`sendFlow.integ.test.tsx`'s "disables Continue... when
missingAssociation/unverifiedAssociation warning is present") does not.** That test mocks
`getTransactionStatus` at the bridge level and injects the warning object directly — it only proves
`StepRecipient.tsx`/`sendRecipientCanNext` correctly *reacts* to the key once present, never that
`validateIntent` (the real logic layer) produces it. Confirmed that wiring was already correct; this
round's actual gap was that `validateIntent.ts` never set these keys in production, so the warning
object arriving at that UI was always `{}`.

**`missingAssociation`/`unverifiedAssociation` (HTS transfers).** `validateTokenTransfer`'s hts branch
now calls `checkAccountTokenAssociationStatus(recipient, {tokenType, parentCurrencyId, contractAddress})`
after `validateRecipient` passes. Widened that function's parameter (`network/utils.ts`) from the full
`TokenCurrency` to `Pick<TokenCurrency, "tokenType" | "parentCurrencyId" | "contractAddress">` — the
only three fields it reads — since `validateIntent` has an `AssetInfo`, not a `TokenCurrency`, and no
CAL access to build one. `parentCurrencyId` needs the branded `CryptoCurrencyId`, not a bare string;
resolved via `getCryptoCurrencyById(currencyId).id`, already imported for the next item.

**`unverifiedEvmAddress` (ERC20 transfers).** Unconditional, matching the legacy bridge exactly — it's
not a check result, it's a static caveat on every ERC20 send (mirror-node EVM-address resolution has
no on-chain confirmation step).

**`insufficientAssociateBalance` (changeTrust) — the "genuinely hard piece," resolved, not skipped.**
The plan assumed `validateIntent` had no way to turn a `currencyId` string into a `CryptoCurrency` for
`getCurrencyToUSDRate`. It does: `getCryptoCurrencyById` (`@ledgerhq/ledger-wallet-framework/currencies`)
is already imported elsewhere in this same package (`network/utils.ts`) for exactly this purpose — no
CAL round trip needed, no rate-provider abstraction to design. **One deliberate simplification, recorded
in the code:** the legacy `isTokenAssociationRequired(account, token)` guard (skip the check when
already associated) reads the full `Account` — `subAccounts`, `hederaResources.isAutoTokenAssociationEnabled`
— neither available to `validateIntent`. Applied the funding floor unconditionally instead: a
changeTrust intent is, by construction, the user choosing to associate, so the only false positive is
re-triggering an already-redundant association, a path this UI doesn't expose today. `validateChangeTrust`
gained a `balances` parameter to compute the account's native worth.

**Test-file changes, not silent edits:** `validateIntent.test.ts`'s existing "estimates the association
fee without erroring" test used a balance (1000 tinybars) that is trivially under any real USD floor —
now that the floor is enforced, that assertion would flip. Renamed it to spell out why it still passes
(bumped the balance high enough) and added a sibling asserting the floor actually fires — the "pinned
pre-migration behaviour" exception, not a silent edit. Mocked `getCurrencyToUSDRate`/
`checkAccountTokenAssociationStatus` in the file's existing `jest.mock("../network/utils", ...)` factory
(both were previously absent, so any call would have thrown `TypeError: ... is not a function` — this
is also why every existing HTS-transfer test needed the new `checkAccountTokenAssociationStatus`
default (`true`) added to `beforeEach`, or they'd have failed for a reason unrelated to what they test).

Tests: 8 new cases in `validateIntent.test.ts` (missingAssociation, unverifiedAssociation, "does not
check when recipient is invalid", a new "ERC20 token transfer" describe block for
`unverifiedEvmAddress`, insufficientAssociateBalance hit/miss, a null-rate-defaults-to-$0 case) plus
the round's actual "done when" proof: `sendRecipientCanNext` called with the real `warnings` object
`validateIntent` produced, asserting `false` — not just that the key exists. `network/utils.test.ts`
needed no changes (the type widening is backward compatible with every existing full-`TokenCurrency`
call). Full `coin-hedera` suite: 42/42 suites, 599/599 tests (was 593 — net +6 after the one rename).
Full non-integration `hedera` sweep in `ledger-live-common`: 7/7 suites, 61/61 tests — unaffected,
confirming the change is contained to `coin-hedera`. `tsc --noEmit` clean on `coin-hedera` (only the
pre-existing `listOperations.v2.ts` baseline error, untouched by this round). `oxlint`: 0 errors,
pre-existing warnings only. `oxfmt --check` clean.

**Round 15 done.** `logic/craftTransaction.ts`'s catch-all branch (the one both a plain native send
and `claimReward` fall through to — `isStakingMode()` excludes claim rewards on purpose) now checks
`txIntent.type === HEDERA_TRANSACTION_MODES.ClaimRewards || txIntent.type === "claimReward"` — the
generic bridge's `computeIntentType` never translates `claimReward`, so the real string seen in
production is the camelCase generic one, not the legacy hyphenated one; checking both costs nothing
and documents why. When true, overrides `recipient` to `getEnv("HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID")`
and `amount` to `1` tinybar, matching the legacy bridge's `prepareTransaction.ts` exactly, just moved
to the one place both the generic and legacy paths build this transaction.

**Neighbour 1 (validateIntent's totalSpent):** added the 1 tinybar to `validateStaking`'s
`totalSpent` for `claimReward` specifically — negligible in practice but technically what leaves the
account, so the balance check should include it. **Neighbour 2 (describeOptimisticOperation):**
checked, no change needed — it already pins the pending row's value to
`account.stakingResources.pendingRewardsBalance`, which is the number the user should see (the
reward, not the 1-tinybar technical trigger), and that still holds.

Tests: new `craftTransaction.test.ts` case drives a hand-built `claimReward` intent (deliberately the
generic string, not the legacy one) through `craftTransaction` and asserts the crafted
`TransferTransaction` moves exactly 1 tinybar to `0.0.98` (mocked env). Full coin-hedera suite: 42/42
suites, 593/593 tests.

**Round 14 done — and it needed a real decision, not just implementation.** `families/hedera/react.test.ts`
(the round's designated oracle) turned out to be unsatisfiable by the fix PLAN_V2 itself described.
The plan said "read from `account.stakingResources.validators` instead," which changes
`useHederaValidators`'s signature from `currency` to `account` — but the test calls it with
`(currency, search)` only, and its `useHederaEnrichedDelegation` cases read expected validator data
from `getCurrentHederaPreloadData(currency)` (the singleton) directly, which an account-keyed
approach can never populate. Flagged this to the user rather than guessing.

**Decision (user): drop the preload-singleton layer entirely for the generic path, aligned with how
the already-migrated families with validator lists do it.** Checked both: EVM's
`useEvmStakingValidators` (`families/evm/staking/react.ts`) and Tezos's `useBakers`
(`families/tezos/react.ts`) are plain `useState`+`useEffect` hooks with a cancellation guard, calling
their network client directly — neither uses `CurrencyBridge.preload`, which is marked `@deprecated`
("prefer loading data lazily in the UI/flows that need it") and which no generic-framework family
implements. This is the real, only-existing precedent — not the account-shape approach PLAN_V2
guessed at.

**Implementation:** `families/hedera/react.ts`'s `useHederaValidators`/`useHederaEnrichedDelegation`
keep their **original signatures** (`currency`, not `account` — no desktop/mobile call site needed to
change, contrary to PLAN_V2's predicted "the trap"). Internally, a new `useHederaAllValidators`
private hook fetches via `apiClient.getNodes({ fetchAllPages: true })` directly, same shape as
`validateIntent.ts`'s Round-8 precedent. Extracted the mirror-node→validator mapping (stake/percentage
math) out of coin-hedera's legacy `preload.ts` into a new exported `mapMirrorNodesToValidators`
(`logic/utils.ts`) so both the legacy bridge's `preload()` and the new hook share one implementation —
`preload.ts`/`preload-data.ts` themselves are **not deleted**: the legacy currency bridge
(`bridge/index.ts`) still wires `preload`/`hydrate`/`getPreloadStrategy` for the rollback path PLAN.md's
"Rollback mechanism" section describes (flip the family flag back to `false`), and deleting them would
remove validator search from that fallback. Only the generic-path consumer (`families/hedera/react.ts`)
stopped depending on the singleton.

**Test file rewritten, not silently edited** — flagging per the ground rules. `react.test.ts` no longer
sets up `bridge/cache`'s `prepareCurrency`/singleton machinery; it mocks `apiClient.getNodes` directly
and computes expected validators via `mapMirrorNodesToValidators(mockNodes)` (the same function the
hook itself now calls) instead of reading them back from the singleton, and uses
`waitFor`/`renderHook` (evm's own test pattern) since the fetch is now async. All three
`useHederaEnrichedDelegation` cases that used to throw `invariant(validator, "No validators available
for test")` (GAP H's own failure mode) now pass for real. This is the "pinned pre-migration behaviour"
exception the ground rules allow, not a silent edit to make a change pass.

**One thing found, not touched:** `coin-hedera/logic/utils.ts`'s `getValidatorFromAccount` also reads
`getCurrentHederaPreloadData` but has zero production callers (confirmed by grep) — left alone as
out-of-scope dead code, not part of this round's stated hooks.

Verification: `families/hedera/react.test.ts` 10/10 (was 6/10 passing-for-the-wrong-reason, 4/10
failing). Full non-integration `hedera`+`generic-coin-framework` sweep in `ledger-live-common`: 35/35
suites, 511/511 tests — GAP H's previously-documented failure is gone, no new regressions. Full
`coin-hedera` suite: 42/42 suites, 593/593 tests (added `mapMirrorNodesToValidators` coverage in
`logic/utils.test.ts`). Desktop hedera suite: 10/10 suites, 46/46 tests. Mobile hedera suite: 9/9
suites, 33/33 tests — both unaffected since the hooks' public signatures never changed.
`tsc --noEmit` clean on both packages (had to rebuild `coin-hedera` and `ledger-wallet-framework`
first — this checkout's `lib`/`lib-es` output predated round 3's `buildIterateResult` addition,
same class of environment gap PLAN.md's Round 12 notes already flagged for mobile Jest). `oxlint`: 0
errors, only pre-existing warnings in files this round didn't touch. `oxfmt --check` clean.

Status legend: ⬜ not started · 🟡 in progress · ✅ done · ⏭️ skipped (say why)

---

## What the prototype already did — do not redo

Read this before planning any work, so nothing is written twice.

**Files it created** (all present in the tree):

- `libs/ledger-live-common/src/families/hedera/` — `signer.ts`, `coinModuleApi.ts`, `bridge/api.ts`,
  `accountRawAssign.ts`, `transaction.ts`, `deviceTransactionConfig.ts`, plus `types.ts` gaining
  `HederaGenericTransaction`
- `libs/coin-modules/coin-hedera/src/logic/` — `getAccountInfo.ts`, `validateIntent.ts`
- tests alongside each, plus `families/hedera/genericFlip.test.ts` as the end-to-end capstone

**Behaviour it already landed:**

- The family flag is **on** (`genericCoinFrameworkFamilies.json`), and `createTransaction.ts` has a
  `hedera` zero-nonce case, so the app runs on the generic bridge today.
- Account discovery works: `BridgeApi.buildIterateResult` was added to
  `libs/ledger-wallet-framework/src/api/types.ts` and `getCoinFrameworkCurrencyBridge` gained an
  optional `currency` 4th param so the family's mirror-node lookup is forwarded. **This is GAP A,
  which JIRA assigns to another team** — leave it in place, and flag it in any PR as a change that
  needs their sign-off rather than ours.
- `buildIntentData` maps `{mode, valId}` onto the staking intent data, without which every staking
  transaction silently no-ops. `computeIntentType` passes generic modes through and translates
  `changeTrust` → `token-associate` — round 18 replaces that source mode with `tokenAssociate`.
- `validateIntent` exists with four branches (native send, token transfer, association, staking) and
  reproduces `stakingNodeId`, `missingStakingNodeId`, `noRewardsToClaim`, `fee`, plus generic
  amount/balance keys.
- Max-send works, `supportedFeatures` declares the staking modes, the second sync no longer throws.
- Desktop and mobile **staking** flows read `valId` (14 desktop + 12 mobile files).

**Deliberately left undone, and why:** the memo path (never wired), the association UI (still legacy
mode), the four association/recipient validation keys (need a fiat rate), ERC-20 gas (no erc20 intent
data), the validator hooks (GAP H), the sync cursor (GAP G), and the claim-rewards fee schedule
(GAP I). Those are rounds 14–20.

**Line numbers are pointers, not facts.** Everything below cites paths and symbols. Re-grep before
editing; the shared framework moves fast.

---

## Why this order

It is a **make-it-verifiable-soonest** order, not a merge order.

- **GAP H comes first** even though it is not the worst bug. Without it the validator list is empty,
  so no staking flow can be driven by hand — which makes every later round unverifiable in the
  running app. It unblocks manual checking of work that already landed in rounds 11–12.
- **Claim rewards next** because it is the one flow that is completely non-functional rather than
  degraded, and it is self-contained.
- **The validation keys, memo and association** follow in increasing order of surface area. Each is
  user-visible; each fails silently today.
- **ERC-20 gas and the sync cursor come last** before the manual pass: neither blocks a flow, both are
  correctness-of-degree rather than correctness-of-kind.
- Round 21 is the user's own step, as Round 13 was in `PLAN.md`.

---

## Rounds

### Round 14 — Validator hooks off the preload singleton (LIVE-36153)

`libs/ledger-live-common/src/families/hedera/react.ts` — `useHederaPreloadData`,
`useHederaValidators`, `useHederaEnrichedDelegation` read a module-level singleton in
`@ledgerhq/coin-hedera/preload-data`, filled by `bridge/cache.ts`'s `prepareCurrency` calling
`bridge.preload(currency)`. The generic currency bridge has no `preload`, so the call no-ops, the
singleton stays empty, and all three hooks return nothing for the whole session.

Read from `account.stakingResources.validators` instead — the generic sync already populates it
(`generic-coin-framework/getAccountShape.ts`'s validators fetch, gated on `bridgeApi.stakingSupported`,
which round 2 set to `true`).

**The trap:** `useHederaValidators(currency)` takes a currency because a singleton is keyed by one.
`stakingResources.validators` lives on a **synced account**, so the signature changes and every caller
moves with it — desktop `shared/staking/ValidatorsSelect.tsx`, `DelegatedPositions/`, mobile
`DelegationFlow/SelectValidator.tsx`, `RedelegationFlow/SelectValidator.tsx`, `Delegations/`. Grep both
apps for each hook name before starting; the call sites are not all in staking flows.

**Done when:** `families/hedera/react.test.ts` passes without being modified — it currently fails, and
it fails for the right reason, so it is the oracle for this round. Plus a desktop and a mobile
validator-selection screen render a non-empty list against a synced-account fixture.

### Round 15 — Claim rewards: inject recipient and amount (LIVE-36276, item 1)

Today a claim-rewards transaction reaches the chain as a transfer to `""` for `0`.

The legacy bridge did this in `coin-hedera/src/bridge/prepareTransaction.ts`:

```ts
if (transaction.mode === HEDERA_TRANSACTION_MODES.ClaimRewards) {
  transaction.recipient = getEnv("HEDERA_CLAIM_REWARDS_RECIPIENT_ACCOUNT_ID");
  transaction.amount = new BigNumber(1);   // 1 tinybar triggers the payout
}
```

Nothing on the generic path does it. `genericPrepareTransaction` is the framework's and knows nothing
about Hedera; the claim-rewards screens (`ClaimRewardsFlowModal/Body.tsx` on desktop,
`ClaimRewardsFlow/Claim.tsx` on mobile) set only `mode`; `createTransaction.ts` gives `recipient: ""`;
and `logic/craftTransaction.ts`'s `isStakingMode()` deliberately excludes claim rewards, so it lands in
the final catch-all that builds a plain coin transfer.

**Do it in `coin-hedera`, not in the UI.** The reward-account id is chain semantics, and two UIs would
have to learn it otherwise. Inject in `craftTransaction`'s catch-all branch when the intent type is
claim rewards, reading the env the legacy path read. `getEnv` has exactly two references in the
monorepo today — the env declaration and the legacy prepare step — so grep it to confirm nothing else
depends on the current behaviour.

Then check two neighbours:

- `logic/validateIntent.ts`'s `validateStaking` sets `totalSpent = estimatedFees` and `amount: 0n`.
  With one tinybar moving, decide whether that tinybar belongs in `totalSpent` and say so in the
  code either way.
- `families/hedera/bridge/api.ts`'s `describeOptimisticOperation` already pins the pending row's value
  to the account's pending rewards. Confirm it still matches what the following sync produces once a
  real claim broadcasts.

**Done when:** a test drives a `claimReward` `GenericTransaction` through `transactionToIntent` into
`craftTransaction` and asserts the built transaction carries the reward-account recipient and an amount
of 1 — not just that crafting did not throw.

### Round 16 — The four dropped validation keys (LIVE-36276, item 2)

`logic/validateIntent.ts` reproduces four error keys. The legacy `bridge/getTransactionStatus.ts`
produces four more, and every one is consumed by shipped UI:

| Key | Consumer | Effect of it being absent |
| --- | --- | --- |
| `missingAssociation`, `unverifiedAssociation` | `coin-hedera/logic/utils.ts`'s `sendRecipientCanNext`, wired at desktop `modals/Send/steps/StepRecipient.tsx` and mobile `SendFunds/02-SelectRecipient.tsx` | **Send-flow Continue is ungated** — an HTS token can be sent to a non-associated recipient; the transfer fails on chain and the fee is lost |
| `insufficientAssociateBalance` | desktop `StepReceiveAccountCustomAlert.tsx`, mobile `AssociateTokenFlow/AssociationInsufficientFundsError.tsx` | Association funding alert never shows |
| `unverifiedEvmAddress` | desktop `StepRecipientCustomAlert.tsx`, mobile `SendSelectRecipient.tsx` | Alert never shows |

Port the three warnings into the token-transfer branch. They need extra mirror-node round trips
(association status of the recipient, EVM-address resolution) — that cost is the reason they were
skipped, not a reason to skip them again.

**The one genuinely hard piece:** `insufficientAssociateBalance` is a USD-denominated funding floor.
The legacy path had the full `Account` and called `getCurrencyToUSDRate(Currency)`; `validateIntent`
receives a `currencyId` string and `Balance[]`, no `CryptoCurrency` object. Resolve it from the
currency id, or thread a rate provider through the coin config — decide, implement one, and record
why in the code. If it turns into its own investigation, stop and split it out rather than stalling
the round.

**Done when:** one test per key on its exact triggering condition, plus a test asserting
`sendRecipientCanNext` returns `false` for a non-associated recipient on the generic path. That last
one is the whole point: the keys exist to gate a button.

### Round 17 — Memo, end to end (LIVE-36276 item 3, LIVE-36151, LIVE-36152)

Five breaks, one seam. Do them together or the middle ones are untestable.

1. **UI writes the wrong field.** Desktop `families/hedera/MemoField.tsx` and mobile `EditMemo.tsx`,
   `MemoTagInput.tsx`, `SendRowsCustom.tsx` all `updateTransaction(tx, { memo })`. The generic
   `transactionToIntent` (`generic-coin-framework/utils.ts`) reads only `memoType` / `memoValue` and
   otherwise emits `{type: "NO_MEMO"}`. Write the generic fields.
2. **The serializer drops it.** `families/hedera/transaction.ts` revives `mode`, `fees`,
   `assetReference`, `assetOwner`, `valId` — add `memoType` / `memoValue`. `families/stellar/transaction.ts`
   is the precedent.
3. **Staking memos are gone.** Legacy `prepareTransaction` set `MAP_STAKING_MODE_TO_MEMO[mode]`
   ("Stake" / "Unstake" / "Restake" / "Collect Staking Rewards"). Set them where round 15 injects the
   claim-rewards recipient, so all chain-semantics defaults live in one place.
4. **The device screen lost its Memo row.** The legacy `coin-hedera/src/deviceTransactionConfig.ts`
   had one in both branches; the new `families/hedera/deviceTransactionConfig.ts` has none.
5. **The size check can never fire.** `HederaMemoExceededSizeError` is unreachable while every intent
   carries `NO_MEMO`, which makes the `HEDERA_MAX_MEMO_SIZE` counter in the send form decorative. Once
   (1) lands, add the check to `validateIntent`'s send and token branches.

**Watch:** `craftTransaction` passes `txIntent.memo.value` into builders typed `memo: string`. Confirm
what a `NO_MEMO` intent actually yields there before and after the change — an SDK call with
`undefined` is not the same as with `""`.

**Done when:** a memo typed in the send flow appears on the crafted transaction; a staking transaction
carries its mode's memo; an over-long memo raises the size error; and the device config test asserts a
Memo row.

### Round 18 — Association: the `tokenAssociate` mode, end to end (LIVE-36150, LIVE-36151, LIVE-36152)

Round 10 landed the coin-module half against `changeTrust`. That is the wrong mode. `changeTrust` is
Stellar's own operation name, and the framework maps it to the `OPT_IN` operation type while
`coin-hedera` types a *synced* association `ASSOCIATE_TOKEN` (`MAP_TX_NAME_TO_CUSTOM_OPERATION_TYPE`,
applied in `logic/listOperations.v2.ts`) — so the pending row would read "Opt in" and relabel itself to
"Associate token" on the first sync. This round gives association its own mode and moves everything,
including both UIs, onto it.

**Shared layer, two additive lines** (`bridge/generic-coin-framework/`):

- `types.ts` — add `"tokenAssociate"` to `GENERIC_TRANSACTION_MODE`.
- `utils.ts` — add its case to `defaultOperationType`, returning `ASSOCIATE_TOKEN`. Without it the new
  mode hits the `OUT` default and an association is labelled a send.

Verified safe before writing this: no exhaustive `Record<GenericTransactionMode, …>` and no default-less
switch on the mode exists in the repo, so the new member reaches no other family. Same directory as
round 20, so no other team is involved — but flag it in the PR as shared code regardless.

**Family layer:**

- `families/hedera/bridge/api.ts` — `computeIntentType` translates `tokenAssociate` →
  `HEDERA_TRANSACTION_MODES.TokenAssociate`, replacing the `changeTrust` case. Translate, never pass
  through: `logic/craftTransaction.ts`, `logic/utils.ts`'s `mapIntentToSDKOperation` and
  `logic/validateIntent.ts` all dispatch on exact equality against the legacy string, so a pass-through
  builds a plain coin transfer on the `CryptoTransfer` schedule for the most expensive operation Hedera
  has.
- `families/hedera/deviceTransactionConfig.ts` — the "Associate Token" method row is keyed on
  `mode === "changeTrust"`; rekey it. Until this round the device shows **"Transfer" plus an Amount
  row** for an association.

**UI:**

- Desktop `ReceiveWithAssociationModal/Body.tsx` — `getTransactionProperties` sets
  `mode: HEDERA_TRANSACTION_MODES.TokenAssociate` and `properties: { token }`. Emit `tokenAssociate`;
  drop the bag. `steps/StepAssociationConfirmation.tsx` reads `transaction.properties.token.name` —
  pass the token through StepProps instead, `Body.tsx` already holds it in state. `types.ts` moves from
  the legacy `Transaction` to `HederaGenericTransaction`.
- Mobile `AssociateTokenFlow/02-Summary.tsx` — same mode change, drop `properties`; the token is
  already in `route.params`, so nothing else needs a new route. `types.ts` moves with it.

**Assert the operation type, don't eyeball it.** Both `ASSOCIATE_TOKEN` and `OPT_IN` have translations
in both apps, so a mismatched type renders cleanly — the only symptom is a history row that changes its
own label a few seconds later.

**Two things not to fix here, and why.** `OptimisticOperationDescriptor` carries only `type` and
`value`, and `describeOptimisticOperation` receives no transaction, so neither of these is reachable
from the family: the pending row's value (legacy used the fee, matching the sync; the generic row uses
the transaction amount, `0`) and its `extra.associatedTokenId` (both apps' `OperationDetails` read it,
so a pending association renders without its token name). Both are cosmetic and both self-correct on the
next sync. Record them in the round notes; do **not** keep `properties` alive to carry them.

**Done when:** association completes on both apps end to end; a test asserts the crafted transaction is
a `TokenAssociateTransaction` priced on the `TokenAssociate` schedule, against a figure that differs
from `CryptoTransfer`'s; the optimistic and the synced operation are both `ASSOCIATE_TOKEN`; the device
config test asserts the Associate Token row and no Amount row for a `tokenAssociate` transaction; the
desktop confirmation step still names the token; and
`grep -rn "properties" apps/*/src/*/families/hedera` returns nothing in product code.

### Round 19 — ERC-20 gas, device rows, claim-rewards fee schedule (LIVE-36276, item 4)

Three fee-and-gas fixes in one round; they touch the same two functions.

1. **Gas limit never reaches the crafted transaction.** Legacy `prepareTransaction` set
   `transaction.gasLimit = estimatedFees.gas` — an on-chain estimate times `ESTIMATED_GAS_SAFETY_RATE`
   (`logic/estimateFees.ts`). `logic/craftTransaction.ts`'s erc20 branch reads
   `txIntent.data.gasLimit` only when `hasSpecificIntentData(txIntent, "erc20")`, and
   `families/hedera/bridge/api.ts`'s `buildIntentData` returns `{type: "none"}` for any send. So every
   generic-path ERC-20 transfer is crafted with `DEFAULT_GAS_LIMIT` (100k) while its displayed fee came
   from a different figure. Produce the erc20 intent data.
2. **The device screen lost its Gas Limit row.** Restore it for ERC-20 sends.
3. **GAP I — claim rewards uses the wrong fee schedule.** `logic/utils.ts`'s
   `mapIntentToSDKOperation` maps delegate / undelegate / redelegate to `CryptoUpdate` but has no
   claim-rewards case, so it falls through to `CryptoTransfer` — the cheaper schedule. Meanwhile
   `validateIntent`'s `validateStaking` already estimates all four modes as `CryptoUpdate`. The two
   paths disagree, and the figure shown before signing is the understated one. One line.

**Order within the round:** do (3) first — it is one line with an existing test target — then (1),
whose fee/gas coupling is easier to reason about once the routing is right.

**Done when:** a crafted ERC-20 transfer's gas limit equals the one its own fee estimation produced
(asserted against a mocked estimate that is deliberately not the default), and
`estimateFees` for claim rewards matches what `validateIntent` computes for the same intent.

### Round 20 — Incremental-sync cursor (LIVE-36148, GAP G)

Round 5 stopped the second sync from crashing. It is still not incremental.

`coin-hedera/src/logic/listOperations.v2.ts` sets `extra.pagingToken = rawTx.consensus_timestamp`, and
`api/index.ts` spreads `...liveOp.extra` **flat** onto `Operation.details`. But
`generic-coin-framework/utils.ts`'s `adaptCoreOperationToLiveOperation` only promotes known keys plus a
nested `details.familyExtra` bag (`readFamilyExtra`). A flat `pagingToken` is neither, so
`getAccountShape.ts`'s `oldOps[0]?.extra?.pagingToken` is always `undefined` and every sync re-fetches
page one.

Two options, both one-liners:

- **(a)** nest under `familyExtra` in `coin-hedera`, and read
  `extra?.familyExtra?.pagingToken ?? extra?.pagingToken`. Note `utils.ts`'s own comment already claims
  `familyExtra.pagingToken` is the cursor, so this makes code and comment agree — but check the other
  flat keys currently spread alongside it (`ledgerOpType`, `assetAmount`, `stakedAmount`) before moving
  anything, since consumers read those where they are.
- **(b)** promote a flat `details.pagingToken` in `adaptCoreOperationToLiveOperation`. Narrower blast
  radius; likely the safer one.

Both edits sit in `ledger-live-common/src/bridge/generic-coin-framework/`, the directory this work
already touches — no other team involved.

**Done when:** a test asserts the cursor from sync N reaches sync N+1's `listOperations` call. Do **not**
settle for asserting the merged operation list — `mergeOps` dedupes, so that passes with no cursor at
all, which is exactly how this stayed hidden.

### Round 21 — Manual verification + `hedera_testnet` (LIVE-36154) — the user's step

Not to be started by a session. Desktop first, mobile if time: add account, sync twice, send, max-send,
send with a memo, HTS transfer, ERC-20 transfer, association, all four staking flows including
validator search, and claim rewards with a real pending reward. Then the same currency checks against
`hedera_testnet` (GAP F) — the flag flips both, and nothing has verified its coin config on the generic
path.

---

## Ground rules for each round

- **Run the round's tests before marking ✅.** Never mark ✅ on "should work".
- **Never edit an existing test to make a change pass.** If a test breaks because it pinned
  pre-migration behaviour, that is a legitimate update — say so in the notes, and replace it with a
  test of the new behaviour rather than deleting it. If it breaks for any other reason, stop and flag.
- **Every prototype shortcut gets a `TODO(prototype):` comment** naming what a production fix would do.
- **Format with `oxfmt`, never Prettier.** `node_modules/.bin/oxfmt -c .oxfmtrc.json <files>`, and
  check with `--check` before calling a round done. The first pass lost time to Prettier silently
  reformatting unrelated hunks: this repo's `format` scripts call `oxfmt` (printWidth 100, trailingComma
  all, arrowParens avoid).
- **Jest:** `node_modules/.bin/jest --watchman=false`. Plain `npx` hits a root-owned `~/.npm` cache.
- **Agents never commit.** Stage on the branch and propose a signed-commit command per logical unit;
  the user commits. Never `--no-gpg-sign`, never `--no-verify`.
- **Update the PROGRESS table and Last session notes before ending a session.**

## Known pre-existing test failures — not yours

- `families/hedera/bridge.integration.test.ts` — real network, blocked by the sandbox allowlist.
- `bridge/generic-coin-framework/getAccountShape.integration.test.ts` — an **EVM** live-RPC test, not
  Hedera.
- Desktop `tsc` has a large pre-existing error baseline unrelated to Hedera. Filter by filename before
  concluding you broke something. Two more pre-existing (not-yours) `tsc` errors, unrelated to Round
  14/15, live in `families/hedera/accountRawAssign.test.ts` and `families/hedera/bridge/api.test.ts`
  (both a `Conversion of type ... to type 'Account' may be a mistake` on an intentionally-partial test
  fixture cast) — neither file was touched by this session.
- A fresh checkout's `coin-hedera` and `ledger-wallet-framework` `lib`/`lib-es` output can predate
  recent `src` changes (round 3's `buildIterateResult` addition was missing from a stale build this
  session hit) — `pnpm build` in each package before trusting a "does not exist in type" `tsc` error.
- Mobile Jest needs `pnpm run build:libs` from the repo root on a fresh checkout, or it dies in
  `src/reducers/index.ts`'s import chain with `Cannot find module '@ledgerhq/...'` errors that look
  nothing like Hedera.

## Reading order for a fresh session

1. This file's PROGRESS block and "What the prototype already did".
2. The JIRA ticket for the current round — the descriptions were rewritten to match this plan and are
   the scope of record.
3. `integrations/hedera/JIRA_UPDATE_PLAN.md` in `blockchain-integration-ai` for how the rounds map onto
   tickets and why each estimate is what it is.
4. `docs/hedera-generic-adapter/PLAN.md` on `wip/hedera-generic-adapter` for the first pass's round
   notes — the "why it was done this way" record. Its gap files
   (`gaps/GAP-A-buildIterateResult.md`, `gaps/OTHER-GAPS.md`) are superseded by this plan for anything
   still open, but remain the investigation trail.

# Conformance check — branch `feat/aleo-private-list-ops-framework` vs [`aleo-listoperations-spec.md`](./aleo-listoperations-spec.md)

Checked on 2026-08-14 against `develop...HEAD` **plus the uncommitted working tree**.
Scope: `libs/coin-modules/coin-aleo`.

Legend: ✅ matches — ⚠️ deviates (deliberate / documented) — ❌ missing — ➖ out of repo scope.

## Summary

| # | Spec area | Verdict |
|---|---|---|
| 1 | Alpaca envelope unchanged | ✅ |
| 2 | Aleo values ride the `Context` (ADR-019) | ✅ |
| 3 | Dual `mode` split | ⚠️ replaced by two modules |
| 4 | `provableId` / `view_key` **both absent → public-only** | ❌ **hard-required instead** |
| 5 | `provableId` xor `view_key` → error | ⚠️ untyped `invariant` |
| 6 | Enrollment accessor `accessAleoSpecificCoinModule` | ➖ lives in `coin-modules` repo |
| 7 | `register` orchestration encapsulated in coin-aleo | ✅ |
| 8 | `scanStatus` → watermark `W` | ⚠️ `synced_up_to` not served yet → `W = 0` |
| 9 | Step 1 — `hi = min(tip, W)`, `lo`, empty-range rule | ⚠️ inclusive `minHeight`, opening-page only |
| 10 | Step 2 — public reads over the range | ✅ (now bounded/paged) |
| 11 | Step 2/4 — consumed-tag collection + spend match | ❌ **not on the framework path** |
| 12 | Step 3 — `records/owned` bounded by `hi`, decrypt | ✅ |
| 13 | Step 5 — one op per `(account, tx)`, ordered | ✅ |
| 14 | Step 5 — private-fee records emitted | ❌ explicitly skipped |
| 15 | Step 6 — paging, `next` = ordinary cursor | ⚠️ different cursor shape, same semantics |
| 16 | Invariant — emitted once and complete | ✅ |
| 17 | Invariant — stable & monotonic | ✅ (tested) |
| 18 | Invariant — completeness ceiling | ✅ |
| 19 | Invariant — `next` is pagination, not progress | ✅ |
| 20 | Invariant — no reorg path | ⚠️ code hedges against reorgs anyway |
| 21 | Errors — typed 4xx/5xx table | ❌ only one of five mapped |
| 22 | Secret handling — redaction of `view_key`/`provableId` | ❌ nothing implemented |

Two findings are worth a decision before merge: **#4** (an API-surface behaviour change vs the spec)
and **#11 / #21** (algorithm step and error contract simply not implemented on this path).

---

## Detail

### 1. Alpaca envelope unchanged ✅

[`api/index.ts:82-91`](../api/index.ts#L82-L91) still exposes
`listOperations(context, address, options) → Page<Operation>`; `ListOperationsOptions` is imported
from the framework, nothing added to it, nothing added to the return shape.

### 2. Aleo values ride the `Context` ✅

[`types/config.ts:28-31`](../types/config.ts#L28-L31):

```ts
export type AleoContext = Context<AleoCoinConfig> & {
  provableId?: string;
  viewKey?: string;
};
```

Extends the ADR-019 `Context` exactly as the spec prescribes, optional fields, built per call — no
shared singleton. Naming is camelCase `viewKey` rather than the spec's `view_key`; cosmetic, and it
matches repo convention.

### 3. Dual `mode` split ⚠️

The spec describes `logic/listOperations.ts` carrying `mode: "coin-framework" | "bridge"`. The branch
**deleted the mode flag** and split the two consumers into separate modules:

- [`logic/listOperations.ts`](./listOperations.ts) — framework/Alpaca surface, merged public+private
- [`bridge/listOperations.ts`](../bridge/listOperations.ts) — public-only bridge path
- shared normalisation in [`logic/listPublicOperations.ts`](./listPublicOperations.ts)

Cleaner than the spec's design and behaviour-preserving for the bridge. Spec text is now stale here.

### 4. Both absent → public-only ❌ — **deviation from spec**

Spec, *Inputs* table and *Algorithm* step 0:

> **Both absent** → current public-only behaviour, unchanged.

Implementation, [`api/index.ts:81-87`](../api/index.ts#L81-L87):

```ts
// Both fields are required: ... neither half can be enriched after the fact (ADR-042).
invariant(provableId && viewKey, `aleo: listOperations requires provableId and viewKey ...`);
```

Absent credentials now **throw** instead of falling back to the public-only path. The inline comment
shows this is deliberate (a public-only page would violate the "emitted once and complete"
invariant), but it is a behaviour change on a shipped API surface and the spec still says otherwise.
**Either the spec's step 0 should be rewritten, or the fallback restored.**

### 5. xor → error ⚠️

Same `invariant`. It does reject the xor case, but as a generic `invariant` violation, not the
spec's `4xx INVALID_ARGS`. See #21.

### 6. `accessAleoSpecificCoinModule` ➖

Spec places it in `apps/coin-service/src/modules/init.ts`, which lives in the `LedgerHQ/coin-modules`
repo — not verifiable from this branch. No trace of it here, as expected.

### 7. `register` orchestration ✅

[`network/utils.ts::accessProvableApi`](../network/utils.ts#L301) performs the three spec'd steps:
`getScannerPublicKey()` → `sdkClient.encryptRegistrationPayload(...)` →
`registerForScanningAccountRecordsEncrypted({ encryptedData, keyId })` → uuid. The scanner only ever
receives the sealed view key; coin-aleo keeps the raw one for decryption. Matches the spec.

`listOperations` **consumes** `provableId` only and never registers — also as spec'd.

### 8. `scanStatus` → watermark `W` ⚠️

The branch extracted [`fetchRecordScannerStatus`](../network/utils.ts#L268) out of
`accessProvableApi` so `listOperations` can call it directly, and added the field
([`types/api.ts:97-102`](../types/api.ts#L97-L102)):

```ts
synced_up_to?: number;   // Height the scanner is complete through. Not served yet, see LIVE-34092.
```

[`listOperations.ts:42-46`](./listOperations.ts#L42-L46) falls back to `0` when absent, which is the
right conservative choice (`synced: true` says nothing about *how far*), but the practical
consequence is that **until LIVE-34092 ships, `W = 0` ⇒ `hi = 0` ⇒ every page is empty**. The spec's
`scannedHeight` is a hard dependency, not yet satisfied. Worth stating explicitly in the spec's
Preconditions.

### 9. Height window ⚠️

| Spec | Implementation |
|---|---|
| `W = scanStatus(...).scannedHeight` | ✅ `getScannerSyncedHeight` |
| `hi = min(tip, W)` | ✅ `Math.min(cursor?.maxBlockHeight ?? W, latestBlock.height)` — plus **`hi` is pinned in the cursor** so a paging run stays a consistent snapshot (spec doesn't say this; good addition, tested at [`listOperations.test.ts:386`](./listOperations.test.ts#L386)) |
| `lo = cursor ?? minHeight` | ✅ via `resolveHeightWindow` |
| `if hi <= lo → empty` | ⚠️ implemented as `maxBlockHeight < minHeight`, **opening page only** |

The two intentional differences are documented in the code
([`listOperations.ts:130-137`](./listOperations.ts#L130-L137)): `minHeight` is inclusive per the
framework contract, and on a resume the window legitimately collapses onto a single block that may
still hold unemitted rows. Sound; the spec's `hi <= lo` wording is the imprecise side.

### 10. Public reads ✅ (extended)

The spec says "explorer tx-by-address over `(lo, hi]`". The branch goes further and makes it
**bounded**: new [`fetchAccountTransitionPage`](../network/utils.ts#L142) + `listPublicOperationsPage`,
with per-transition normalisation, a trailing-transaction drop, and a ×4 widening retry. Fully
described in [`listOperations.paging.md`](./listOperations.paging.md). Strictly an improvement over
spec (the spec's design implied an `O(n²/limit)` refetch per page).

### 11. Consumed tags + spend matching ❌ — **spec steps 2 & 4 not on this path**

Spec:

> 2. … and the **tags on consumed inputs** of each transition.
> 4. **Spend** — match decrypted-record tags against step-2 consumed tags → attribute each private
>    debit and amount.

`buildConsumedRecordTags` exists at
[`listPrivateOperations.ts:20-42`](./listPrivateOperations.ts#L20-L42) but is called **only from
`listPrivateOperations` (bridge path)**. The framework `listOperations` never builds or matches tags —
it correlates public and private by `transaction_id` overlap
([`listOperations.ts:186-203`](./listOperations.ts#L186-L203)).

The code argues the case explicitly ([`listPrivateOperations.ts:44-50`](./listPrivateOperations.ts#L44-L50)):

> Spend reconciliation is deliberately not part of this — only the bridge needs it … A history
> listing does not: a record being spent later does not unmake the operation that created it.

That reasoning holds for *listing*, but the spec's step 4 is about **attributing private debits and
amounts**, not about unspent-ness. Needs an explicit call: either the spec drops step 4 for the
listing surface, or the outgoing-private attribution has to be shown to be covered by
`enrichOutgoingRecord`. **Highest-value item to resolve.**

### 12. Owned records bounded + decrypted ✅

[`listOperations.ts:149-156`](./listOperations.ts#L149-L156) fetches from `from`, filters to the
window *before* decrypting (`isInWindow`), and decrypts through `enrichPrivateRecords`. The
`programs: []` opt-out correctly widens it past `credits.aleo` to token records.

One deviation from the spec's "creation height `<= hi`": the fetch itself is still exhaustive from the
lower bound — acknowledged as *Known limitation 1* in `listOperations.paging.md`. The expensive half
(decryption) *is* bounded, so the invariant is preserved; only the network cost isn't.

### 13. One op per `(account, tx)`, ordered ✅

`recordsToEnrich` is keyed by `transaction_id`, with a deterministic pick by `(output_index,
commitment)` ([`isEarlierOutput`](./listOperations.ts#L53-L59)) so a self-transfer owning both output
and change still yields one operation. `buildOrderedOperations` sorts on `(height, hash)`. Covered by
tests at [`listOperations.test.ts:188`](./listOperations.test.ts#L188) and
[`:206`](./listOperations.test.ts#L206).

### 14. Private-fee records ❌

Spec step 5 lists "private-fee records" among the operations to build. Implementation excludes them
twice:

- the records fetch filters to `PRIVATE_TRANSFER_FUNCTIONS`
  ([`constants.ts:28-32`](../constants.ts#L28-L32)), which does not contain `fee_private`;
- [`enrichPrivateRecord`](../network/utils.ts#L544-L546) returns `null` for `FEE_PRIVATE` with a
  documented reason (their transition lives in `details.fee.transition`, so `transition_index` would
  mis-resolve).

The reason is technical and legitimate, but the spec claims coverage the code does not provide.

### 15. Paging / `next` ⚠️

Spec: "internally composite `{public, private, hi}`". Implementation
([`listOperations.helpers.ts:18-23`](./listOperations.helpers.ts#L18-L23)):

```ts
{ minHeight, maxBlockHeight, order, resume?: { block, transactionId } }
```

A single identity resume point instead of two per-source positions, plus the pinned ceiling and an
echo of `minHeight`/`order` so a cursor replayed against a different window is rejected
([`assertCursorMatchesRequest`](./listOperations.helpers.ts#L68-L77)). Base64url-encoded and opaque.
Semantically what the spec asked for and strictly stronger on the framework's non-volatility clause;
the spec's parenthetical is stale.

### 16-19. Output invariants ✅

- **Once and complete** — no placeholder path exists; `toMergedOperation` completes the public row
  from the owned record in the same pass ([`utils.ts:282-305`](./utils.ts#L282-L305)).
- **Stable & monotonic** — total order + identity cursor + `dropThroughResumePoint`; directly tested
  ("returns the very same rows when a page is replayed", [`:423`](./listOperations.test.ts#L423);
  "pages the range without overlap or gaps", [`:321`](./listOperations.test.ts#L321)).
- **Completeness ceiling** — `maxBlockHeight` clamp; tested at
  [`:59`](./listOperations.test.ts#L59) ("withholds operations above the scanner watermark").
  Additionally, the merge window clamps to the range the *public* stream actually reached, so private
  rows are never emitted ahead of the public rows sharing their heights
  ([`listOperations.ts:176-181`](./listOperations.ts#L176-L181)) — a refinement the spec doesn't cover
  but which the ceiling invariant requires once the public fetch is bounded.
- **`next` is pagination, not progress** — `next` is emitted only when `page.hasMore && resume`
  ([`:243-247`](./listOperations.ts#L243-L247)); tested at [`:439`](./listOperations.test.ts#L439).

### 20. No reorg path ⚠️ (harmless)

The spec asserts AleoBFT finality ⇒ no reorgs. The implementation nonetheless hedges:
`dropThroughResumePoint` compares in the total order rather than by identity precisely so "a resume
point that has since vanished — a reorg dropped it, the explorer re-indexed it — still cuts at the
right place". Defensive, costs nothing; just note the spec and the code disagree on whether reorgs
are a concern.

### 21. Errors ❌ — **contract not implemented**

| Spec condition | Spec result | Actual |
|---|---|---|
| `provableId` xor `view_key` | `4xx INVALID_ARGS` | untyped `invariant` throw (also fires when **both** absent, see #4) |
| `provableId` unknown / not registered | `4xx PROVABLE_ID_NOT_FOUND` | ⚠️ closest match: `AleoApiConfigurationResetError` on HTTP 422 ([`network/utils.ts:268-282`](../network/utils.ts#L268-L282)) — different name, no status code |
| Scanner unavailable | `5xx SCANNER_UNAVAILABLE` (retryable) | ❌ raw error propagates, not classified, no retryable marker |
| `view_key` does not match owned records | `4xx VIEW_KEY_MISMATCH` | ❌ not detected — mismatched decrypts yield `null` and are silently dropped |
| Decrypt failure on a record | fail the page | ⚠️ **partial**: `enrichPrivateRecords`' doc says "a decrypt failure rejects", and it does for a *thrown* failure — but `enrichPrivateRecord` returns `null` on several soft failures (unresolvable transition, skipped record), and nulls are filtered out at [`listOperations.ts:80`](./listOperations.ts#L80), so those records are dropped rather than failing the page |

Note the positive side of the 422 handling: `listOperations` deliberately re-reads scanner status on
**every** page so a dropped enrollment surfaces as `AleoApiConfigurationResetError`
([`listOperations.ts:119-121`](./listOperations.ts#L119-L121)) rather than a bare 4xx later.

### 22. Secret handling ❌

The spec calls redaction **mandatory**:

> Redact `view_key` and `provableId` from all logs, traces, and spans … Errors never echo secrets —
> failures reference the `address`, never the `view_key`/`provableId` values.

Nothing on this branch implements it. Grepping the module finds no scrubbing rule, no redaction
helper, and no Datadog config touching these fields. The error messages themselves are compliant —
[`api/index.ts:86`](../api/index.ts#L86) references the `address` only, and
`AleoApiConfigurationResetError` carries no payload — but the *logging/tracing* requirement is
untouched. Either it belongs to a different layer (say so in the spec) or it is an open task.

---

## Notes on spec drift

Three places where the **spec** is now behind the code rather than the other way round, and should be
refreshed: the `mode` flag (#3), the composite-cursor parenthetical (#15), and the implied
refetch-per-page public read (#10). The `Open points` section's ADR-019 caveat is resolved — the
`Context` extension shipped, no `options` fallback was needed.

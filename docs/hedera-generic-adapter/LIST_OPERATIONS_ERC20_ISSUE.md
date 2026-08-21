# ERC20 sync issue — Hgraph indexing-lag freeze uses the wrong signal, and its blast radius is too wide

**Status: investigated, not fixed. No LIVE-361xx ticket covers this.** Root cause confirmed with live
mainnet repros (see "Evidence" below). Fix direction proposed but not implemented — needs a design
decision (see "Recommended direction").

## Symptom (real repro, mainnet)

Broadcast an ERC20 transfer (e.g. WBTC) through Ledger Live's Hedera flow:

1. Pending operation shows correctly: sub-account `OUT`, main account `FEES` with the `OUT` as a
   `subOperation`.
2. After the next sync, the pending operation is removed — but nothing correct replaces it. The
   drawer that was showing it goes blank.
3. The main account's operation list shows `CONTRACT_CALL` instead of `FEES`. The sub-account still
   shows a pending `OUT` for about a minute, then it resolves and the correct `FEES`/token-transfer
   pair appears.

So the transaction is real and confirmed on Hedera in seconds, but Ledger Live shows a wrong,
temporarily-stuck state for roughly a minute before self-healing.

## Where the logic lives

- `libs/coin-modules/coin-hedera/src/logic/utils.ts:533-628` —
  `mergeTransactionsFromDifferentSources`. Merges Mirror Node transactions with Hgraph-sourced ERC20
  transfers, then (lines 592-611) runs `isERC20Delayed`: if any mirror `ContractCall` transaction is
  newer than Hgraph's reported "latest indexed" timestamp, it drops **every transaction in the merged
  batch newer than that cutoff — regardless of type**, deferring all of it to the next sync.
- `libs/coin-modules/coin-hedera/src/network/hgraph.ts:31-60` — `getLatestIndexedConsensusTimestamp`,
  the watermark query used for that cutoff. Queries Hgraph's `ethereum_transaction` table.
- `libs/coin-modules/coin-hedera/src/logic/listOperations.v2.ts` — `processCoinTransfers` (mirror-only
  fallback, produces `id: ${hash}:${operationType}`, `operationType` mapped from `rawTx.name` — for a
  `ContractCall` this becomes literally `CONTRACT_CALL`) vs. `processERC20TokenTransfer` (Hgraph-
  enriched path, produces the main-account op as `id: ${hash}:FEES`). **These two representations of
  the same transaction have different ids**, so even without any freeze, a mirror-only entry that
  later gets replaced by the enriched one cannot be merged/updated in place — it can only be seen as
  two unrelated operations, or (if the freeze applies) never shown at all until enrichment lands.

## Evidence

Validated live against mainnet using a throwaway script (`ledger-skills` repo,
`scripts/hedera/wbtc-erc20-hgraph-lag.ts` — outside this repo, kept there since it sends real,
minimal WBTC amounts and needs an operator key). Sent 1 base unit of WBTC (`0.0.8835924` →
`0.0.9124531`, contract `0xD7D4d91d64a6061fA00a94E2b3A2D2A5FB677849`) and polled Hgraph every 5s.

**First attempt was invalid** — comparing `erc_token_transfer.consensus_timestamp` (returned by
Hgraph as a plain JSON number) against an exact target value silently never matched, because Hedera's
nanosecond timestamps (~1.79×10¹⁸) exceed JS's safe-integer range (2^53 ≈ 9×10¹⁵) and get rounded on
the way through JSON. Production code already works around this exact issue in one place
(`network/api.ts:298-300`'s `findTransactionByContractCallV2`, via a ±10µs window) but not in the
`isERC20Delayed` comparison. Fixed the test to use a bounded timestamp window instead of exact
equality, then re-ran clean.

**Corrected result** (single WBTC send, mainnet):

| t (from send) | `ethereum_transaction` watermark vs. our tx | our row in `erc_token_transfer`? |
|---|---|---|
| +5s | behind | no |
| +10s | already past our tx's timestamp | no |
| +15s .. +50s | still past | no — **gap persists ~40s** |
| +56s | past | **yes** |

**Broader candidate sweep** (second WBTC send, checked `transaction`, `ethereum_transaction`,
`contract_log`, `contract_result`, `contract_action`, `contract_state_change`, `erc_token_transfer`
in parallel, both their global watermark and whether *our specific transaction* had landed in each):

- `ethereum_transaction`: our transaction **never appeared at all**, in any poll, even though its
  global watermark kept climbing the whole time. Strong signal this isn't "a different, laggier
  pipeline" — it's very likely the wrong transaction category entirely (`EthereumTransaction`, i.e.
  raw RLP-encoded txs relayed from an external EVM wallet/JSON-RPC, as opposed to the native
  `ContractExecuteTransaction` both Ledger Live and this test actually submit).
- `transaction`, `contract_log`, `contract_result`, `contract_action`, `contract_state_change`: all
  had our row within the **first poll** (~6s) — too early to be useful as a proxy for
  `erc_token_transfer`'s own (much slower) decode step.
- `erc_token_transfer`'s **own** `MAX(consensus_timestamp)` was the only signal that moved exactly
  when our row actually landed — by definition it can't be ahead of what's truly indexed.

Also checked Hgraph's schema by introspection (`{ __schema { queryType { fields { name } } } }`) for
a dedicated indexing-status field for `erc_token_transfer`. None exists. Hgraph does expose per-job
watermarks (`{job_name, last_processed_ns, updated_at}`) for four *other* pipelines —
`bridge_watermark`, `dex_watermark`, `lending_watermark`, `oracle_watermark` — but nothing equivalent
for ERC20 transfer decoding.

## Why "just fix the watermark" isn't enough

Swapping `ethereum_transaction` for `erc_token_transfer`'s own watermark fixes the *signal* (it's
provably correct, since it's the table's own progress) but not the *blast radius*. The filter at
`logic/utils.ts:601-611` drops **every transaction type** past the cutoff, not just `ContractCall`s.

Worst case: Hgraph's ERC20 decoder stalls for an hour (or has any outage — there's no exposed
watermark to tell "idle" apart from "stuck"). A user's ERC20 transfer becomes the one unresolved entry
sitting at the front of their sync window. Every subsequent transaction of *any* kind — a plain HBAR
send, staking, HTS transfers — is newer than that stuck entry, so the batch filter drops all of it,
every sync, until the ERC20 transfer resolves. The account looks completely frozen, not just missing
one operation's nice label. This is true of the current (`ethereum_transaction`-based) filter too, but
incidentally less likely to trigger since that watermark tracks an apparently unrelated transaction
category and moves independently of real ERC20 decode progress. A `erc_token_transfer`-based
watermark would trigger this freeze *more reliably* whenever Hgraph's ERC20 decode genuinely lags —
correct as a signal, worse as a UX outcome, unless the filter's scope is fixed at the same time.

A fixed wall-clock grace window (e.g. "defer any `ContractCall` younger than 90s") was considered and
rejected: the lag is not a fixed constant — it could be seconds, minutes, or (in an outage) unbounded,
so any fixed number is either too short (freeze recurs) or too long (unnecessary delay in the normal
case).

## Recommended direction (not implemented)

Stop deferring transactions at all. Never hide a transaction while waiting on Hgraph:

1. Show every mirror transaction immediately using whatever data is available at sync time — for an
   unresolved `ContractCall`, that means a plain, honestly-labeled entry (mirror-only, no ERC20
   breakdown yet), not nothing.
2. Nothing else is ever held back. Since every transaction shows up right away, there's no "batch
   drops everything newer" failure mode — HBAR sends, staking, HTS transfers are always unaffected by
   ERC20 decode speed.
3. When `erc_token_transfer` does catch up (whenever that is), swap the plain entry for the
   `FEES`/token-transfer pair, in place, same spot in the list.

Step 3 needs one fix first: the mirror-only and Hgraph-enriched representations of the same
transaction currently get **different ids** (`${hash}:CONTRACT_CALL` vs. `${hash}:FEES`), so a later
sync would add a second operation rather than replace the first. Needs a shared identity between the
two versions (e.g. matched by transaction hash rather than by the current id scheme) for the "upgrade
in place" to work instead of producing duplicates.

## Open question sent to the Hgraph team

Asking for (a) confirmation of what `ethereum_transaction` actually tracks, and (b) whether an
`erc_token_transfer`-equivalent watermark exists or could be added, following the same
`{job_name, last_processed_ns, updated_at}` shape as `bridge_watermark`/`dex_watermark`/
`lending_watermark`/`oracle_watermark`. Awaiting reply — if they add one, the "recommended direction"
above still stands as the actual fix (it removes the freeze-blocks-everything failure mode
regardless), but a real Hgraph watermark could let the mirror-only fallback window be much shorter in
the common case.

## Status / next steps

- [ ] Hgraph team reply (external, blocking confirmation of root cause on their side)
- [ ] Decide on the id-matching scheme for upgrade-in-place (mirror-only ↔ Hgraph-enriched)
- [ ] Implement: stop filtering/deferring transactions in `mergeTransactionsFromDifferentSources`;
      always emit mirror-only fallback ops; upgrade in place when Hgraph enrichment lands
- [ ] File a LIVE-361xx ticket once the fix direction is confirmed

# Spec: `listOperations` (Aleo, public + private range merge)

> Status: **Draft**. Realises Option B-bis ([ADR](aleo-a4-indexing-adr.md)) inside the
> coin module. Cost: [study](aleo-listoperations-bbis-study.md). Date: 2026-06-12.

## Conformance to the current Alpaca API

The envelope is **unchanged**: `coin-aleo` already exposes
`listOperations(address, options) → { items, next }` (`src/api/index.ts`), with
`options: ListOperationsOptions = { minHeight, cursor?, limit?, order? }`, and the
logic already carries a dual `mode: "coin-framework" | "bridge"`
(`logic/listOperations.ts`), where the `coin-framework` mode is the Alpaca surface
(today public-only). B-bis adds **nothing to `options` or to the return shape**: the two
Aleo values it needs (`provableId`, `view_key`) ride the **`Context` threaded to the low
layers** ([ADR-019](https://ledgerhq.atlassian.net/wiki/spaces/CF/pages/6883377252),
*Option 2 — pass a context to low layers*), not the Alpaca surface. Enrollment and scan
progress live on an Aleo-specific accessor (below).

## Preconditions

`provableId` is **already registered** with the Provable scanner via the Aleo-specific
accessor (`register`, next section). `listOperations` only **consumes** a live
`provableId`; it never registers. Full-scan latency is observable via the accessor's
`scanStatus`, not blocking on the caller.

## Signature

```
// Alpaca surface — options and return shape unchanged; Aleo values ride the Context.
listOperations(
  address: string,
  options: ListOperationsOptions,    // unchanged Alpaca pagination
  context?: Context,                 // ADR-019 Context; Aleo extends it (below)
) => Promise<{ items: Operation[]; next?: string }>
// ListOperationsOptions = { minHeight: number; cursor?: string; limit?: number; order?: "asc"|"desc" }

// ADR-019 Context = { config, logger, client }. Aleo extension:
type AleoContext = Context & {
  provableId?: string,   // Provable scan registration handle  ┐ both present → public+private merge
  view_key?:   string,   // decrypt + tag-derive                ┘ both absent  → current public-only
}
// view_key is per-account, so an AleoContext is built per call/account — never a shared singleton.
```

## Enrollment & scan surface (Aleo-specific accessor)

`register(view_key) → provableId` and `scanStatus(provableId)` are **Aleo-only** — no
analogue exists on the shared `CoinModuleApi`, so they must **not** ride the Alpaca
surface. They are exposed through a coin-specific accessor, exactly the pattern the
coin-service already uses for Tron's non-standard reads
([`accessTronSpecificCoinModule`](https://github.com/LedgerHQ/coin-modules/blob/main/apps/coin-service/src/modules/init.ts#L99-L115)):

```
// apps/coin-service/src/modules/init.ts — alongside accessTronSpecificCoinModule
accessAleoSpecificCoinModule(network: "aleo" | "aleo-testnet") => {
  register(viewKey: string): Promise<{ provableId: string }>,
  scanStatus(provableId: string): Promise<{
    synced: boolean; percentage: number; startHeight: number; scannedHeight: number; // = W
  }>,
}
```

**How `register` works** — the orchestration already exists inside `coin-aleo`
(`network/utils.ts::accessProvableApi`); the accessor only surfaces it:

1. `getScannerPublicKey()` → `{ public_key, key_id }`.
2. **Seal** the view key to that key via `sdkClient.encryptRegistrationPayload(...)` —
   the scanner only ever receives the **encrypted** view key.
3. `registerForScanningAccountRecordsEncrypted({ encryptedData, keyId })` → `provableId`
   (a Provable-issued uuid, surfaced under the friendlier `provableId` name).

So all Provable endpoint handling (pubkey, seal, `register/encrypted`, `status`,
`records/owned`) stays encapsulated in `coin-aleo` for A4. `coin-aleo` keeps the **raw**
view key for decryption; the scanner gets only the sealed copy. `scanStatus` is the same
accessor, proxying Provable `status(provableId)` for the watermark `W` that
`listOperations` reads.

## Inputs

| Field | Required | Meaning |
|-------|:--------:|---------|
| `address` | yes | Account public address (public reads). |
| `options.minHeight` / `options.cursor` | one | Resume point; `cursor` authoritative when present. |
| `options.limit`, `options.order` | no | Page size and direction. |
| `context.provableId` + `context.view_key` | pair | **Both present** → public+private merge. **Both absent** → current public-only behaviour, unchanged. (One without the other → error.) |

## Algorithm

0. **No `provableId`/`view_key` in context** → existing `mode: "coin-framework"`
   public-only path, untouched. Otherwise:
1. `W = accessor.scanStatus(provableId).scannedHeight`; `hi = min(tip, W)`;
   `lo = cursor ?? minHeight`. If `hi <= lo`, return `{ items: [], next: undefined }`
   (nothing complete to return yet).
2. **Public** — explorer tx-by-address over `(lo, hi]`; collect public transfers/fees
   and the **tags on consumed inputs** of each transition.
3. **Private** — `records/owned(provableId)` with creation height `<= hi`; decrypt via
   `aleo-backend`.
4. **Spend** — match decrypted-record tags against step-2 consumed tags → attribute
   each private debit and amount.
5. **Build** — one complete `Operation` per `(account, tx)` (4 transfer types,
   public↔private self-transfers, private-fee records); order by `(height, tx)`.
6. **Page** — emit `limit` operations per `order`. `next` is the ordinary Alpaca
   pagination cursor (internally composite `{public, private, hi}`, since a page merges two
   sources); `next: undefined` means the `(lo, hi]` listing is exhausted — the normal
   end-of-list signal, not a sync-progress flag.

## Output invariants

- Each `(account, tx)` is emitted **once and complete** — no placeholder, no later
  enrichment.
- Results are **stable and monotonic**; paging never rewrites a prior row.
- **Completeness ceiling**: only operations up to `hi = min(tip, W)` are returned, so every
  row is fully merged (public + private). Operations between `W` and the chain tip are
  **withheld**, never returned public-only.
- **`next` is pagination, not progress**: `next: undefined` only means the current
  `(lo, hi]` listing is exhausted (ordinary Alpaca end-of-list). Incremental sync is the
  standard pattern — re-poll with `minHeight` = the last synced height; as `W` rises, newer
  complete operations appear on later calls (tip latency, not loss).
- **No reorg path**: AleoBFT finality ⇒ committed blocks never revert.

## Errors

| Condition | Result |
|-----------|--------|
| `provableId` xor `view_key` (only one supplied) | `4xx INVALID_ARGS` |
| `provableId` unknown / not registered | `4xx PROVABLE_ID_NOT_FOUND` |
| Scanner unavailable | `5xx SCANNER_UNAVAILABLE` (retryable) |
| `view_key` does not match owned records | `4xx VIEW_KEY_MISMATCH` |
| Decrypt failure on a record | fail the page (do not emit partial ops) |

## Secret handling (`view_key`, `provableId`)

No bespoke field-level encryption is required on the call itself — both deployments
keep the parameters inside a trust boundary:

- **Ledger Live**: `listOperations` runs **in-process** in the coin module; the
  `view_key` never crosses a network boundary.
- **LES**: all hops are **internal service-to-service** (lama-adapter → coin-service →
  coin-aleo) over the internal network with TLS; the parameters never transit a public
  edge.

The real exposure is **observability**, and it is mandatory to close:

- **Redact `view_key` and `provableId` from all logs, traces, and spans** (Datadog
  scrubbing rules on request/response payloads). `view_key` is the hard secret;
  `provableId` is a capability handle and is also redacted.
- **Errors never echo secrets** — failures reference the `address`, never the
  `view_key`/`provableId` values.

Optional hardening, if a hop must be treated as untrusted: **seal the `view_key` to
`aleo-backend`** (the same cryptobox seal already used for scanner registration) so it
travels as ciphertext and is opened only at the decrypt service.

## Open points

- View-key lifetime between calls (re-supplied per call vs held) — custody policy (gap 4).
- Threading `provableId`/`view_key` via the ADR-019 `Context` (chosen) depends on ADR-019
  landing. ADR-019's decided `Context` is `{ config, logger, client }`, so this extends it
  with Aleo credential fields; until ADR-019 ships, a local extension on `options` is the
  interim fallback.
- `aleo-backend` batch decrypt for large ranges.
- `register`/`scanStatus` exposed via the Aleo-specific accessor (chosen, Tron pattern),
  keeping the shared `CoinModuleApi` untouched.

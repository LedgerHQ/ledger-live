# A4 integration into `generic-coin-framework`

> Status: **Draft** — implementation spec deriving from
> [ADR-040 — A4 integration](https://ledgerhq.atlassian.net/wiki/x/EQBKqgE) (Coin Framework space).
> Tracking: [LIVE-30906](https://ledgerhq.atlassian.net/browse/LIVE-30906).

## 1. Goal

Extend the existing `generic-coin-framework` bridge so that **balances and operation history can be
served by A4** (Ledger's stateful blockchain indexer) instead of, or as a complement to, the current
`local` / `remote` coin-module backends — while keeping all write operations (craft / estimate /
validate / sign / broadcast) on the existing backend.

This is **Option 4** of ADR-040: *extend the `bridge-coin-framework` `kind`*, rather than building a
specialised coin module, a wrapper, or a separate bridge. Sync logic
([`getAccountShape.ts`](./getAccountShape.ts)) is **not rewritten**: the bridge keeps pulling history,
adapting it to `LiveOperation`s, and storing it locally. Only the *source* of balance/operations
changes.

### Non-goals

- No sync-free / `listOperations`-on-`AccountBridge` refactor (ADR Option 5 — long-term portfolio
  service work, out of scope).
- No change to the write path: crafting/estimation/validation/broadcast stay on `local` (coin module)
  or `remote` (coin-service) backends.
- No new families. We target the families already enabled in
  [`genericCoinFrameworkFamilies.json`](./genericCoinFrameworkFamilies.json) (`evm`, `xrp`, `stellar`,
  `tezos`; `solana` currently `false`).

## 2. Current architecture (baseline)

The bridge is parameterised by two strings: a `network` (family, e.g. `evm`) and a `kind`.

```
impl.ts
  └─ getCoinFrameworkAccountBridge(family, kind)   // accountBridge.ts
  └─ getCoinFrameworkCurrencyBridge(family, kind)  // currencyBridge.ts
        └─ genericGetAccountShape(network, kind)   // getAccountShape.ts
              ├─ getCoinModuleApi(currency.id, kind)  // api/index.ts  → CoinModuleApi & BridgeApi
              └─ getBridgeApi(currency, network)      // bridge.ts      → BridgeApi (chain hooks)
```

- [`api/index.ts`](./api/index.ts) — `getCoinModuleApi(network, kind)`:
  - `kind === "local"` → dynamic-imports a per-family local coin module
    (`api/local/{evm,xrp,stellar,tezos,solana,tron,canton}.ts`).
  - otherwise → `getNetworkCoinModuleApi(network)`
    ([`api/network/network-coin-service.ts`](./api/network/network-coin-service.ts)), the "remote"
    coin-service HTTP backend (PoC from
    [PR #13591](https://github.com/LedgerHQ/ledger-live/pull/13591)).
- Both return a `CoinModuleApi<any> & BridgeApi` (from `@ledgerhq/coin-module-framework` v3.5.x).
- **`kind` is currently hard-coded to `"local"`** at
  [`impl.ts:81`](./../impl.ts#L81) and [`impl.ts:104`](./../impl.ts#L104). `"remote"` is reachable in
  `getCoinModuleApi` but not yet wired from `impl.ts`.

### `CoinModuleApi` surface used by the sync path

[`getAccountShape.ts`](./getAccountShape.ts) only consumes these methods on the read path:

| Method | Used for |
| --- | --- |
| `lastBlock()` | `blockHeight` |
| `getBalance(address, balanceOptions)` → `Balance[]` | native + token balances, staking (`balance.stake`) |
| `listOperations(address, { minHeight, cursor, order })` → `Page<Operation>` | history (incremental, paginated) |
| `getValidators()` | staking validators (when `stakingSupported`) |
| `refreshOperations(pendingOps)` *(optional)* | confirm pending ops on explorer-less integrations |

Everything else on `CoinModuleApi` (`craftTransaction`, `craftRawTransaction`, `estimateFees`,
`validateIntent`, `combine`, `broadcast`, `getNextSequence`, `getBlock`, `getBlockInfo`, `getStakes`,
`getRewards`, `validateAddress`, `craftTransactionData`) is used by the **write** path
(`prepareTransaction`, `getTransactionStatus`, `estimateMaxSpendable`, `signOperation`,
`signRawOperation`, `broadcast`) — these must remain on the local/remote backend.

### Account identity

`getAccountShape` builds the LL `accountId` via `encodeAccountId({ type: "js", version: "2",
currencyId, xpubOrAddress: address, derivationMode })`. The `address` field is:

- the **EOA address** for account-based families (EVM, XRP, Stellar, Tezos, Solana) → **1 derivation
  path = 1 address = 1 account**;
- the **xpub** for UTXO families (Bitcoin) → **1 account per xpub**, with many derived addresses.

This is the crux of the A4 account-composition mapping (§4).

## 3. A4 overview (what the bridge talks to)

A4 is a **stateful** indexer: an account must be *registered* before it is monitored. An A4 account is
an arbitrary, **client-controlled** set of addresses. Data is standardised (not chain-specific).

Base URLs (`/a4/{network}` prefix):

| Env | Base |
| --- | --- |
| Production | `https://explorers.api.vault.ledger.com/a4` |
| Pre-prod | `https://explorers.api.live.ppr.ledger-test.com/a4` |
| Staging | `https://explorers.api.live.stg.ledger-test.com/a4` |

Relevant endpoints (see [wallet-integration-guide.md](https://github.com/LedgerHQ/a4/blob/main/docs/wallet-integration-guide.md)
and [ethereum docs](https://explorers.api.vault.ledger.com/a4/ethereum/docs/)):

| Method | Path | Purpose |
| --- | --- | --- |
| `PUT` | `/v2/account/{accountId}` | Create account (idempotent), body `{"tags":[]}` |
| `PUT` | `/v2/account/{accountId}/addresses` | Add addresses (known addresses ignored), body `["0x…", …]` |
| `GET` | `/v2/account/{accountId}` | Account `syncStatus` (`Uninitialized` / `Waiting` / `Synchronized`) |
| `GET` | `/v2/account/{accountId}/state/balance?atBlock=latest` | Current balances per asset |
| `GET` | `/v2/account/{accountId}/state/balance/history` | Historical balances (countervalues — phase 2+) |
| `GET` | `/v2/account/{accountId}/state/operations?blocks=[0,latest]&size=N` | Operations, cursor-paginated |
| `GET` | `/v1/account/{accountId}/state/utxos` | Spendable UTXOs (Bitcoin-family) |

### Account / address lifecycle

- Address states: `Pending → Indexing → Indexed` (or `Failed → Indexing` retry).
- Account `syncStatus` = union of address states: `Uninitialized` / `Waiting` / `Synchronized`.
- **While `Uninitialized`, balance/operations return `422 Unprocessable Entity`.** The client must
  treat the account as "loading" and poll `/v2/account/{accountId}` (or consume the event stream)
  until `Waiting`/`Synchronized`.

### Version control & datacenter roaming

- A4 runs on 3 datacenters; the LB routes by geolocation, so a client can be silently moved between
  DCs (outage, roaming, VPN). DC account definitions are **eventually** consistent.
- `A4-Account-Version` = SHA-256 of the account's sorted addresses joined with `"|"`.
- Every response returns `A4-Account-Version` and `A4-Datacenter` headers.
- Every request accepts optional `A4-If-Account-Version`; on mismatch the server returns
  **`412 Precondition Failed`**.
- Roaming-handling strategy (ADR requirement): on `412`, **re-register all addresses** on the new DC,
  poll until `syncStatus` is `Waiting`/`Synchronized`, then retry. (Alternative: retry-until-match;
  we adopt proactive re-registration so the user is not blocked indefinitely.)

### Response shapes (ethereum)

```jsonc
// GET .../state/balance
{ "assets": {
    "native": { "type": "int", "value": "100000000" },
    "erc20.0xdAC17F958D2ee523a2206206994597C13D831ec7": { "type": "int", "value": "2300000" } } }

// GET .../state/operations  → items[]
{ "txId": "0x…", "block": { "hash": "0x…", "height": 1234567, "time": "…Z" },
  "asset": "native", "amount": "1000000", "type": "send" }
```

Note the A4 **asset identifier is a string** (`native`, `erc20.<contract>`, …) and an A4 operation is
**one entry per transaction per asset** with a signed-ish `amount` and a coarse `type`
(`send`/`receive`/…). This differs from the `CoinModuleApi` model and requires an adapter (§5.3).

## 4. A4 account model mapping

> **One A4 account per derivation path.** For account-based chains (Ethereum, XRP, …) that means one
> A4 account holds exactly **one address**. For UTXO chains (Bitcoin) one A4 account corresponds to
> **one xpub**, and the client registers all addresses derived from that xpub into it.

| LL family | LL `xpubOrAddress` | A4 account composition | A4 addresses registered |
| --- | --- | --- | --- |
| EVM, XRP, Stellar, Tezos, Solana | EOA address | 1 address | `[address]` |
| Bitcoin (UTXO, future) | xpub | 1 xpub | all derived/observed addresses for that xpub |

### A4 `accountId` derivation

A4 lets the client choose `accountId` (UUID in the docs' examples). We need a **deterministic,
client-derivable** id so any LL instance / device pairing resolves the same A4 account without extra
state. Implemented in [`api/a4/accountId.ts`](./api/a4/accountId.ts):

- `accountId = SHA-256(normalize(xpubOrAddress))`, where `xpubOrAddress` is the address
  (account-based) or **the xpub (UTXO/Bitcoin — the id hashes the xpub, not a derived address)**. The
  256-bit digest is formatted as a UUID-shaped string (8-4-4-4-12) to match A4's id shape.
- **No `a4:`/network prefix in the hash.** The A4 network is conveyed by the request URL path
  (`/a4/{network}/…`), so the same key under different networks maps to distinct A4 accounts
  server-side; there is no need to fold the network into the id.
- **Case normalization:** only EVM hex addresses (`/^0x[0-9a-fA-F]+$/`) are lowercased, since EIP-55
  checksum and lowercase denote the same account. Bitcoin xpubs and other base58/bech32 addresses
  (XRP, Stellar, Tezos, …) are **case-sensitive and kept verbatim** — lowercasing a base58 xpub would
  corrupt it and split one account into two.
- The id is **stable across app versions and platforms** (pure function of the key).
- **Open questions (ADR):** whether a salt is required, and final confirmation of the format with
  Cloud Wallet / BACK ([BACK-11270](https://ledgerhq.atlassian.net/browse/BACK-11270),
  [BACK-11342](https://ledgerhq.atlassian.net/browse/BACK-11342)).
- The LL `accountId` is unchanged — it stays `encodeAccountId(...)`. A4's `accountId` is an internal
  detail of the A4 adapter, derived on the fly from `xpubOrAddress`.

## 5. Implemented design

> Implemented on branch `feat/a4-integration`. The decision is **config-driven, per chain** — no new
> `kind` value and no change to `impl.ts`. `kind` keeps selecting the write/fallback backend
> (`local` / `remote`); A4 read/registration is layered on top based on remote coin config.

### 5.1 Per-chain config in `getCoinModuleApi`

`getCoinModuleApi(network, kind)` resolves the existing delegate, then wraps it with the A4 adapter
when the chain's config asks for it. `network` here is the **currency id** (e.g. `ethereum`) — every
call site passes `account.currency.id` / `currency.id` — so the decision is naturally per chain.

```ts
// api/index.ts
export async function getCoinModuleApi(network, kind) {
  const delegate = await getDelegateApi(network, kind); // existing local/remote
  const { read, register } = resolveA4ChainConfig(network); // ./config (remote coin config)
  if (read || register) return createA4CoinModuleApi(network, delegate, { read });
  return delegate;
}
```

This keeps the existing `local`/`remote` paths untouched and additive, with A4 off by default.

### 5.2 `createA4CoinModuleApi(network, delegate, { read, endpoint })`

A new adapter under `api/a4/` returning `CoinModuleApi<any> & BridgeApi`. It **wraps a `delegate`**
(the local or remote module) and overrides **only the read methods**, delegating everything else:

| Method | A4 adapter behaviour |
| --- | --- |
| `getBalance(address, opts)` | optimistic `GET state/balance` → reconcile/retry → map A4 assets → `Balance[]`; **on 5xx / `422` / network → `delegate.getBalance`** |
| `listOperations(address, opts)` | optimistic `GET state/operations` (cursor/`minHeight`→`blocks` range) → reconcile/retry → expand+map → `Page<Operation>`; **fallback → `delegate.listOperations`** |
| `lastBlock()` | **always `delegate`** (A4 has no last-block endpoint) |
| `getValidators` / `getStakes` / `getRewards` | **always `delegate`** (A4 staking indexation not ready — see §6) |
| `craftTransaction`, `craftRawTransaction`, `estimateFees`, `validateIntent`, `combine`, `broadcast`, `getNextSequence`, `getBlock`, `getBlockInfo`, `validateAddress`, `craftTransactionData` | **always `delegate`** (write path) |
| `BridgeApi` hooks (`getTokenFromAsset`, `getAssetFromToken`, `stakingSupported`, `balanceOptions`, …) | from `delegate` / `getBridgeApi` (unchanged) |

**Stateless, optimistic, A4-as-source-of-truth.** The adapter keeps **no local registration cache**.
It computes the expected A4 account version (`SHA-256` of the sorted registered addresses joined with
`"|"`, per the A4 spec), sends it as `A4-If-Account-Version`, and reacts to A4's response:

```
read mode — readWithFailover(address, doRead, fallback):
  accountId = deriveA4AccountId(address)            // no local "is registered?" flag
  addresses = addressesFor(address)                 // [address]; UTXO expands the xpub
  ifVersion = expectedVersion(addresses)            // SHA-256(sorted.join("|"))
  try:
    return doRead(accountId, ifVersion)             // optimistic — no pre-registration
  catch (status):
    if 404 (account does not exist):
        PUT /v2/account/{accountId} { tags:[{ key:"source", value:"Ledger Wallet" }] }
        PUT /v2/account/{accountId}/addresses [addresses]
        retry doRead  (may be 422 → fall back)
    if 412 (version mismatch — DC roaming / missing addresses):
        PUT /v2/account/{accountId}/addresses [addresses]
        retry doRead  (may be 422 → fall back)
    // 422 (Uninitialized), 5xx, transport → fall back to delegate (transparent)
    return fallback()
```

For UTXO families, `addressesFor(address)` expands the xpub into its derived/observed addresses (reuse
the family's address-derivation logic); for account-based families it is `[address]`.

**Create-account body** always carries the tag `{ "key": "source", "value": "Ledger Wallet" }`.

**Register-only mode (`read: false`):** the adapter performs the same optimistic
poll-and-reconcile against A4 (so the account gets registered during sync) but reads everything from
the `delegate`. **Any A4 failure is logged and swallowed** — never surfaced, never blocking the sync.

**Failover (ADR "always gracefully fall back to local on 5XX"):** `5xx`, transport errors, and `422`
(account `Uninitialized`) all fall back to the `delegate` so the user sees no regression while A4
finishes indexing. `412` triggers one address re-registration + retry before falling back.

### 5.3 Data transformations (A4 → `CoinModuleApi`)

These are the substantive transforms; they belong in `api/a4/adapters.ts` and must round-trip into the
shapes [`utils.ts`](./utils.ts) / [`getAccountShape.ts`](./getAccountShape.ts) already expect.

1. **Asset identifier parsing.** A4 string `native` / `erc20.<contract>` / `<std>.<ref>` → framework
   `AssetInfo` (`{ type: "native" }` or `{ type, assetReference, assetOwner }`). Owner is the account
   address. Token-type mapping (`erc20` → token type understood by `getTokenFromAsset`) is
   family-specific and may need a small lookup. **Open: canonical A4 asset-id grammar across families.**
2. **Balance.** A4 `assets` map → `Balance[]`:
   - `native` → `{ value, asset: { type: "native" }, locked? }`.
   - each token → `{ value, asset: parsedAssetInfo }`.
   - `locked` / `stake` are **not** provided by A4 today → staking still comes from the `delegate`
     (§6). `extractBalance`/`buildSubAccounts` already tolerate missing fields.
3. **Operations expansion.** A4 returns **1 op per transaction**; LL needs **1 op per transfer**, and
   `buildParentOperations` in [`getAccountShape.ts`](./getAccountShape.ts) expects per-transfer
   `Operation`s carrying `details.assetReference` / `assetOwner` / `internal` / `parentSenders` /
   `parentRecipients` so it can synthesise parent + sub-operations and FEES/NONE ops. The adapter must:
   - emit a native op and/or token op(s) per A4 tx (using the A4 `asset` + `amount`, sign of `amount`
     for IN/OUT),
   - populate `details` so `adaptCoreOperationToLiveOperation` ([`utils.ts:164`](./utils.ts#L164))
     reconstructs `extra.assetReference/assetOwner/feePayer/internal/...` correctly,
   - set `op.type` to the framework value that maps to LL `OperationType` (`OUT`/`IN`/`FEES`/`NONE`/…).
   - **Risk:** A4 "loses some transaction details / encodes some as events" and "merges parent/token
     account". Where A4 does not expose enough to split a tx into transfers, we lose sub-operation
     fidelity vs the local module. Needs validation per family against real data.
4. **Pagination.** Map `ListOperationsOptions` → A4 query:
   - `minHeight` → `blocks=[minHeight, latest]` (incremental sync; `getAccountShape` computes
     `minHeight = lastOp.blockHeight + 1` unless full re-sync).
   - `cursor` → A4 `next.cursor`; return A4's `next` as the framework `Page.next`.
   - `order: "desc"` (the sync requests newest-first).
5. **Block.** A4 op `block { hash, height, time }` → `tx.block`; `tx.fees` / `tx.feesPayer` from A4
   fields (confirm A4 exposes fees on the operation; if not, fees come from the delegate or are 0).

### 5.4 Configuration (remote coin config)

The ADR's **two independent flags** are expressed as a single **common** (cross-family) coin config
object, remotely editable via Firebase and keyed by chain. It lives in
[`config.ts`](./config.ts) and is merged into the global `liveConfig`
([`config/sharedConfig.ts`](./../../config/sharedConfig.ts)) under `config_generic_a4`:

```jsonc
// config_generic_a4 (LiveConfig / Firebase)
{
  "chains": {
    // read balances + operations from A4 (implies register), against the prod endpoint
    "ethereum": { "enabled": true, "endpoint": "https://explorers.api.vault.ledger.com/a4" },
    // register on A4 during sync, keep reading from delegate, against staging
    "polygon":  { "registerOnly": true, "endpoint": "https://explorers.api.live.stg.ledger-test.com/a4" }
  }
}
```

`resolveA4ChainConfig(currencyId)` returns `{ read, register, endpoint }`:

- chain absent / both false → A4 off (plain delegate). **`enabled` and `registerOnly` default to
  `false`.**
- `registerOnly: true` → `{ read: false, register: true }` (background registration — ADR flag 1);
- `enabled: true` → `{ read: true, register: true }` (read switch — ADR flag 2, implies registration);
- `endpoint` is **per chain** (`chains[id].endpoint`), falling back to `A4_API_ENDPOINT`.

This is **per chain** (currency id), so rollout is staged one chain at a time and can be toggled
remotely **without an app update**. The default A4 base URL is `A4_API_ENDPOINT` in
[`@ledgerhq/live-env`](./../../../../env/src/env.ts) (production), used when a chain sets no
`endpoint`.

## 6. Staking (known gap)

- A4 does **not** index staking yet ([BACK-11379](https://ledgerhq.atlassian.net/browse/BACK-11379)).
- `getAccountShape` reads staking from `balance.stake` (per-`Balance`) and from `getValidators()`.
- **Decision for v1:** the A4 adapter keeps `getBalance`'s **staking** contributions and
  `getValidators` / `getStakes` / `getRewards` on the **`delegate`**. Concretely, the adapter merges
  A4 native/token balances with the delegate's staking balances, OR the bridge issues a side
  `getStakes`/`getBalance` to the delegate for staking — to be decided. Until A4 exposes staking,
  treat chains where `stakingSupported` as **read from delegate for the staking slice**.
- Tezos uses `usesStakingPositions` (per-position) and EVM-style uses `stakingResources` aggregate —
  both keep flowing from the delegate, so no UI change.

## 7. Open questions (carried from ADR)

- **A4 `accountId` derivation:** hash algorithm + salt; UUID vs hex; cross-platform stability. (§4.1)
- **Asset identifier grammar:** canonical A4 asset-id format per family and mapping to LL tokens.
- **Operation fidelity:** can A4 ops be expanded into the per-transfer + parent/sub-op model without
  regressions? Fees/feePayer presence on A4 ops. (§5.3)
- **`refreshOperations`:** how does it interact with A4 (ADR explicitly flags this as TODO)? Likely
  stays on the delegate for explorer-less confirmation.
- **Transparent failover:** can we switch A4 ⇄ delegate mid-sync without corrupting the locally stored
  history (block-height/cursor continuity differs between backends)? Define cursor/`minHeight`
  invariants so a fallback sync does not duplicate/skip ops.
- **Sync indicator UI:** do we surface "Account synchronizing" while A4 is `Uninitialized`/roaming?
- **Write backend:** local coin module vs coin-service for the write path under `a4+*`.
- **Balance history / countervalues:** whether to consume A4 `state/balance/history` (later phase).

## 8. Phasing

1. **Plumbing** — parse composite `kind` in `getCoinModuleApi`; add `api/a4/` skeleton wrapping a
   delegate; add `A4_API_ENDPOINT` env; no behaviour change (flags off).
2. **Background registration** — flag 1: `ensureRegistered` during sync for enabled families; metrics
   on A4 coverage / `syncStatus`. Still reads from delegate.
3. **Read switch (EVM first)** — flag 2: `a4+{local|remote}` for EVM; implement balance + operations
   adapters + transforms; 5xx/422/412 failover; validate op fidelity against real accounts.
4. **Extend families** — XRP, Stellar, Tezos (account-based, 1 address = 1 account).
5. **UTXO (Bitcoin)** — xpub→addresses registration, `/v1/.../state/utxos`; requires UTXO account
   management not yet present in `generic-coin-framework` (ADR Option 2's discarded con). Separate
   milestone.
6. **Staking on A4** — once BACK-11379 lands, move staking reads to A4.

## 9. Testing

- **Unit:** asset-id parsing, balance mapping, operation expansion (1 tx → N transfers + parent/FEES),
  pagination/cursor mapping, version-header handling, `accountId` derivation stability.
- **Failover:** mock 5xx/422/412 and assert transparent fallback to delegate and re-registration on
  412.
- **Integration:** extend [`getAccountShape.integration.test.ts`](./getAccountShape.integration.test.ts)
  with an A4-backed `kind`; compare A4-sourced account shape vs local-sourced for the same address
  (balances, op count, sub-accounts) to catch fidelity regressions.
- **Contract:** snapshot real A4 responses (ppr/staging) per family as fixtures.

## 10. Touch points (files)

| File | Change | Status |
| --- | --- | --- |
| [`api/index.ts`](./api/index.ts) | resolve delegate, wrap with A4 adapter per chain config | ✅ done |
| [`config.ts`](./config.ts) *(new)* | `config_generic_a4` schema + `resolveA4ChainConfig` / `getA4Endpoint` | ✅ done |
| [`config/sharedConfig.ts`](./../../config/sharedConfig.ts) | merge `a4Config` into `liveConfig` | ✅ done |
| [`api/a4/index.ts`](./api/a4/index.ts) *(new)* | `createA4CoinModuleApi(network, delegate, { read })`, registration, failover | ✅ done |
| [`api/a4/client.ts`](./api/a4/client.ts) *(new)* | A4 HTTP client (`@ledgerhq/live-network`), version headers, env URL | ✅ done |
| [`api/a4/adapters.ts`](./api/a4/adapters.ts) *(new)* | A4 → `Balance[]` / `Operation[]` transforms, asset-id parsing | ✅ done |
| [`api/a4/accountId.ts`](./api/a4/accountId.ts) *(new)* | deterministic A4 `accountId` derivation | ✅ done |
| [`@ledgerhq/live-env`](./../../../../env/src/env.ts) | add `A4_API_ENDPOINT` default | ✅ done |
| `api/a4/*.test.ts` *(new)* | unit tests (accountId, adapters, adapter failover/register-only) | ✅ done |
| `impl.ts` | unchanged — `kind` stays `local`; A4 is config-driven inside `getCoinModuleApi` | n/a |

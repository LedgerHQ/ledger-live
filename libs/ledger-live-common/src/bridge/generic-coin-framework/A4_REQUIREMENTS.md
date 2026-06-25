# A4 integration — Requirements

> Status: **Draft**. Companion to [A4_INTEGRATION_SPEC.md](./A4_INTEGRATION_SPEC.md) (the *how*).
> This document lists **what** the A4 integration into `generic-coin-framework` must satisfy.
> Source: [ADR-040](https://ledgerhq.atlassian.net/wiki/x/EQBKqgE), [LIVE-30906](https://ledgerhq.atlassian.net/browse/LIVE-30906).

Requirement keywords follow RFC 2119 (**MUST**, **SHOULD**, **MAY**).

## 1. Scope

- **R1.1** — The integration **MUST** extend the existing `bridge-coin-framework` (`generic-coin-framework`)
  rather than introducing a new bridge or per-coin variant. (ADR Option 4.)
- **R1.2** — A4 **MUST** be used only as the source of **balances and operation history**. The write
  path (craft, estimate, validate, sign, broadcast) **MUST** continue to use the existing
  `local` / `remote` coin-module backend.
- **R1.3** — Sync logic **MUST NOT** be rewritten: the bridge keeps pulling history, adapting it, and
  storing it locally. Only the data *source* changes.
- **R1.4** — The integration **MUST** be additive: existing `local` and `remote` behaviour
  **MUST** remain unchanged when A4 is disabled.

## 2. Account model

- **R2.1** — There **MUST** be **one A4 account per derivation path**.
- **R2.2** — For account-based chains (e.g. Ethereum, XRP, Stellar, Tezos), one address **MUST** map to
  one A4 account (1 derivation path = 1 address = 1 A4 account).
- **R2.3** — For UTXO chains (e.g. Bitcoin), one xpub **MUST** map to one A4 account, and all addresses
  derived from that xpub **MUST** be registered into that single A4 account.
- **R2.4** — The A4 `accountId` **MUST** be deterministically derivable from the account's
  `xpubOrAddress` (address for account-based, **xpub for UTXO — the id hashes the xpub itself, not a
  derived address**), with **no extra persisted state**.
- **R2.5** — The A4 `accountId` **MUST** be a hash of **only** the `xpubOrAddress` — no network or
  namespace prefix. The A4 network is conveyed by the request URL, so the same key under different
  networks resolves to distinct A4 accounts server-side.
- **R2.6** — The derived A4 `accountId` **MUST** be stable across app versions and platforms
  (desktop, mobile, CLI) for the same account.
- **R2.7** — The Ledger Live `accountId` **MUST NOT** change as a result of this integration.
- **R2.8** — `accountId` derivation **MUST** preserve case for case-sensitive keys (base58 xpubs,
  XRP/Stellar/Tezos addresses); only case-insensitive EVM hex addresses may be normalized. Lowercasing
  a base58 xpub would corrupt it and split one account into two.

## 3. Account registration

- **R3.1** — The client **MUST** auto-register an account on A4 if it does not already exist
  (create account + add addresses), idempotently.
- **R3.2** — Registration **MUST** be gated by a dedicated config switch enabling *background
  registration* independently of switching the data source. (See R6.1.)
- **R3.3** — For UTXO accounts, registration **MUST** add all derived/observed addresses of the xpub.
- **R3.4** — Registration **MUST** be idempotent and safe to call on every sync (re-adding known
  addresses is a no-op on A4).
- **R3.5** — The client **MUST NOT** persist or cache the A4 registration state locally. A4 is the
  single source of truth; the client always relies on A4 responses to decide what to do.
- **R3.6** — The client **MUST** act optimistically: it issues the intended A4 call and reacts to the
  response. It **MUST** detect and reconcile (a) *account does not exist* → register, and (b) *account
  version mismatch* → re-add the addresses, then retry.
- **R3.7** — In register-only mode, any A4 failure **MUST** be fully transparent to the user: logged
  and swallowed, never surfaced and never blocking or failing the sync.
- **R3.8** — The create-account request (`PUT /v2/account/{id}`) **MUST** include the tag
  `{ "key": "source", "value": "Ledger Wallet" }`.

## 4. Data source switch & resilience

- **R4.1** — Switching balance + history to A4 **MUST** be gated by a separate config switch,
  independent of the registration switch. (See R6.2.)
- **R4.2** — The client **MUST** gracefully fall back to the local/remote coin module when A4 is
  unavailable (HTTP `5xx` or transport error), with no user-visible failure.
- **R4.3** — When an A4 account is not yet ready (`syncStatus = Uninitialized`, i.e. balance/operations
  return `422`), the client **MUST NOT** show an error; it **MUST** either fall back to the
  local/remote module or present a "synchronizing" state.
- **R4.4** — The client **MUST** handle datacenter roaming using A4 account version headers
  (`A4-Account-Version` / `A4-If-Account-Version`): on `412 Precondition Failed` it **MUST** reconcile
  (re-register addresses on the new datacenter and/or retry) so data eventually returns correctly.
- **R4.5** — Failover between A4 and the local/remote module **MUST NOT** corrupt the locally stored
  history (no duplicated or skipped operations across a backend switch).

## 5. Data fidelity

- **R5.1** — Balances returned by A4 **MUST** be adapted to the framework `Balance[]` model
  (native + token assets), preserving the values rendered today.
- **R5.2** — A4 asset identifiers **MUST** be mapped to the framework `AssetInfo` model and resolve to
  the correct Ledger Live token currencies.
- **R5.3** — A4 operations **MUST** be expanded so that Ledger Live receives **one operation per
  transfer** (A4 returns one operation per transaction), preserving parent / sub-operation and
  FEES / NONE semantics produced by the current sync.
- **R5.4** — Token (sub-account) balances and operations **MUST** be correctly attributed to their
  sub-accounts.
- **R5.5** — Operation history sourced from A4 **MUST** be incremental and paginated (resumable via
  block height / cursor), consistent with the current sync behaviour.
- **R5.6** — The account shape produced from A4 **SHOULD** match the one produced from the local module
  for the same address (balances, operation count, sub-accounts) within documented, accepted deltas.

## 6. Configuration

Configuration is a **common (cross-family) coin config** object, remotely editable via Firebase
(`config_generic_a4`), **keyed per chain** (currency id) — not an app feature flag and not an env
variable. Each chain entry has `enabled` (read from A4, implies registration), `registerOnly`
(register only), and `endpoint` (per-chain A4 base URL).

- **R6.1** — There **MUST** be a config switch to progressively enable **background registration** of
  accounts on A4 (`registerOnly`).
- **R6.2** — There **MUST** be a separate config switch to **switch balance + history to A4**
  (`enabled`).
- **R6.3** — `enabled` and `registerOnly` **MUST** both default to **false** (A4 off) for any chain
  not explicitly configured.
- **R6.4** — Configuration **MUST** be resolvable per chain so rollout can be staged one chain at a
  time.
- **R6.5** — Configuration **MUST** be remotely editable (Firebase), taking effect **without an app
  update**.
- **R6.6** — The A4 API endpoint **MUST** be configurable **per chain** (production / pre-production /
  staging), via the chain's `endpoint`, falling back to an env default.

## 7. Staking

- **R7.1** — Staking data (delegations, rewards, validators, staking positions) **MUST** keep
  rendering correctly while A4 lacks staking indexation; staking reads **MUST** come from the
  local/remote module until A4 supports them ([BACK-11379](https://ledgerhq.atlassian.net/browse/BACK-11379)).
- **R7.2** — Chains using aggregate `stakingResources` and chains using per-position
  `stakingPositions` (e.g. Tezos) **MUST** both continue to work unchanged.

## 8. Quality & rollout

- **R8.1** — All behaviours (registration, failover on 5xx/422/412, asset/operation adaptation,
  `accountId` derivation stability) **MUST** be covered by automated tests.
- **R8.2** — Rollout **MUST** be progressive: background registration first (no data switch), then
  read switch per family, EVM first.
- **R8.3** — Enabling/disabling A4 via config **MUST NOT** require an app update.

## 9. Out of scope

- Sync-free integration (`listOperations`/`getBalance` directly on `AccountBridge`) — long-term
  portfolio service work.
- New families beyond those already enabled in
  [`genericCoinFrameworkFamilies.json`](./genericCoinFrameworkFamilies.json).
- Consuming A4 balance history for countervalues (possible later phase).

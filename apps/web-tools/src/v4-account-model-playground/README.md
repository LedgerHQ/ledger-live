NB: this folder will eventually be moved to its own app. and the data-layers will be a top level concept to follow more the re-architecture of the project.

# V4 Account Model Playground

Experiment to rework the Account model and validate a slice-based architecture before future integration in Ledger Live. This playground lives in web-tools.

**Challenge**: We still have to put the **coin-specific fields** we used to have on **Account** somewhere (e.g. `bitcoinResources`, `cosmosResources`). The bridge returns and expects a full **Account**, including those extras. So we need an additional slice that keeps them in memory and gives them back when we reconstruct **Account** for the bridge. See §2 (new slice) and the field mapping below.

---

## 1. Structure

- **Entry**: Route and page (e.g. `/v4-account-model-playground`), lazy-loading the main App.
- **Layout**: `index.ts` exporting the main App, optional `context.ts` for shared dependencies (e.g. sync drivers, bridge vs alpaca), `useEnv.ts` if needed for API/env.
- **UI**: `components/` with one main `App.tsx` and feature components (e.g. account list, per-slice panels, sync controls).
- **State**: Redux store (`store/index.ts`) combining the v4 slices (see below); we use Redux from the start for the multi-slice model. Redux DevTools are enabled for debugging.

---

## 2. The Slices (including coin-specifics)

Data is no longer stored in a single **Account[]** store. It is split into **five slices** (the first four are in `libs/live-wallet/src/playground/entities/v4/`; the fifth is for the POC):

| Slice | Store shape | Purpose |
|-------|-------------|--------|
| **accounts** | `{ byId: Record<id, AccountV4>, allIds: string[] }` | Core account; token accounts as **AccountV4.subAccounts** (TokenAccountV4). Ops for token accounts live in operationHistory, not on the type. |
| **operationHistory** | `{ byAccountId: Record<accountId, { operations, nextPagingToken? }> }` | Operations per account (consumed by transaction list). **nextPagingToken** (optional) for “load more” when the API supports pagination. |
| **transactional** | `{ pendingOperationsByAccountId }` | Pending ops per account (Send flow). Errors are UI state (component-local). |
| **balanceHistory** | `{ byAccountId: Record<accountId, BalanceHistoryCache> }` | Balance history per account (consumed by portfolio graph). Today and in this POC it is **derived state** computed from operations + balance; in the future it will be a dedicated API. |
| **swapHistory** | (same idea) | **Out of scope for this POC** — forget swap history here |
| **accountCoinResources** | `{ byAccountId: Record<accountId, AccountResources> }` | **TEMPORARY PLACEHOLDER.** Single generic bucket for all coin-specific extras (bitcoinResources, tezosResources, nfts, etc.) so we can reconstruct **Account** for the bridge. Target later: one slice per coin (see below). |

- **AccountV4** and **TokenAccountV4** are the types used in this playground. They are **copied in place** into `apps/web-tools/src/v4-account-model-playground/` (from `libs/live-wallet/src/playground/entities/v4/`). All new code for this experiment lives only inside that folder.
- Data layer lives under `data-layer/` with one folder per domain (accounts, operationHistory, balanceHistory, accountCoinResources), each with `schema.ts`, `slice.ts`, `actions.ts` (when needed), `selectors.ts`.

### Top-level selectors (reconstructing legacy Account) — §2.1

**Goal**: Expose a single “account view” that recomposes the legacy **Account** (types-live) from the v4 slices, so the UI can be migrated incrementally: screens that still expect **Account** can rely on these selectors instead of reading five slices separately.

- **Per-slice selectors** (in each domain’s `selectors.ts`) give raw slice data by `accountId`. They are the building blocks.
- **Top-level selectors** live above the domains (e.g. `store/selectors.ts` or `shared/topLevelSelectors.ts`) and **compose** all slices for one account:
  - **Sync**: `selectAccountReconstructionInput(state, accountId)` returns the bundle of slice data (accountV4, operations, pendingOperations from **transactional** slice, balanceHistory, accountCoinResources) needed to call `reconstructAccountFromReconstructionInput(input)`, or `undefined` if the account is missing. This is a pure selector; no async work.
  - **Async**: The full legacy **Account** requires token resolution (`findTokenById`), so it cannot be a pure selector. The intended pattern is: a hook (e.g. `useReconstructedAccount(accountId)`) that uses `selectAccountReconstructionInput` and, when defined, calls `reconstructAccountFromSlices(...)` and returns the resulting `Promise<Account>`, with loading/error state as needed.
- **Why this helps migration**: Existing UI that takes an **Account** can switch to `useReconstructedAccount(accountId)` and keep working while the store is already slice-based. New UI can still read slices directly where a full **Account** is not needed (e.g. operation list by account id). Bridge callers (e.g. sync) already use `reconstructAccountFromSlices` with data they have; top-level selectors centralize “get everything needed for this account from the store” in one place.

### Coin-specific resources: placeholder vs coin-by-coin

**accountCoinResources** is a **temporary placeholder**: one generic slice storing every coin’s extras (`Record<accountId, Record<string, unknown>>`). It exists so we can split/reconstruct the legacy **Account** without touching the bridge contract. It is **not** the target design:

- No typed API per family (everything is `unknown`).
- No family-specific persistence or “db” (one flat map for all coins).
- No collocated logic (load, selectors, persistence) per coin.

**Target direction: one slice per coin family.** Each family (Bitcoin, Cosmos, Tezos, etc.) should have its own domain with:

- **Own schema** — e.g. `BitcoinResources` (utxos, walletAccount) with Zod; no generic bag.
- **Own “db”** — state keyed by accountId for that family only; e.g. `bitcoinResources.byAccountId` only holds Bitcoin accounts.
- **Collocated logic** — load (e.g. sync UTXOs only), selectors, and future persistence live in that domain.
- **Clear ownership** — Bitcoin-specific types and rules stay in the Bitcoin domain; reconstruction reads from `bitcoinResources` when the account is Bitcoin.

**bitcoinResources** in this playground is the **reference example**: see `data-layer/bitcoinResources/` (schema, slice, selectors, README). When the bridge returns a Bitcoin account, we dispatch `bitcoinResources` into that slice and **exclude** `bitcoinResources` from the generic `accountCoinResources` placeholder. Other families (cosmosResources, tezosResources, etc.) still go into the placeholder until they get their own slice. Adding a new coin slice follows the same pattern: new domain under `data-layer/<coin>Resources/`, wire split/reconstruct to use it, and stop putting that key in the placeholder.

### Field mapping: Account (types-live) → slices

Every field on **Account** (and **TokenAccount**) must live in exactly one slice so we can reconstruct the full **Account** when calling the bridge.

| Field on Account / TokenAccount | Slice |
|---------------------------------|--------|
| type, id, seedIdentifier, xpub?, derivationMode, index, freshAddress, freshAddressPath, used, **currencyId**, **balance** (string), **spendableBalance** (string), creationDate, blockHeight, **feesCurrencyId**?, operationsCount, subAccounts? (each with **tokenId**), lastSyncDate, syncHash? | **accounts** (AccountV4 / TokenAccountV4). Stored as ids + strings for serializability; see §8. |
| operations (each op with **value**, **fee** as string) | **operationHistory** |
| pendingOperations (same shape) | **transactional** (pendingOperationsByAccountId) |
| balanceHistoryCache | **balanceHistory** |
| swapHistory | **swapHistory** (out of POC scope) |
| **Coin-specific resources** (see list below) | **accountCoinResources** (placeholder) |
| nfts? | **accountCoinResources** |

**Coin-specific resource fields** (Account & { ... } per family). All live in **accountCoinResources** placeholder for this POC: bitcoinResources, tezosResources, suiResources, solanaResources, cosmosResources, concordiumResources, celoResources, tronResources, polkadotResources, nearResources, multiversxResources, iconResources, cardanoResources, aptosResources, algorandResources, kaspaResources, hederaResources, cantonResources, aleoResources.

Some families also extend **TokenAccount** (e.g. SolanaTokenAccount, CantonTokenAccount, TonSubAccount); token-account-level extras can be stored in **accountCoinResources** keyed by token account id if needed for reconstruction.

---

## 3. Sync Flow: One Source of Truth, Multiple Stores

- **Today**: Sync produces a single **Account** (with nested operations, balanceHistory, etc.) and the app stores it in one place.
- **Target**: Sync still uses the **existing bridge interface** that returns a full **Account** (for compatibility). We do **not** change the bridge contract in this POC.
- **Our job**: When we receive that **Account** from the bridge (or from an alpaca-driven path, see below), we **split** it and **dispatch into each slice**:
  - **accounts slice**: upsert the account (and token accounts) as **AccountV4** / **TokenAccountV4**. SubAccounts persist **inside AccountV4** as **TokenAccountV4**; their operations are **not** on the type — they live in the **operationHistory** slice, keyed by (token) account id.
  - **operationHistory slice**: Thunk `loadOperationHistory` triggers fetch; reducers apply payload (operations + nextPagingToken). Sync action `setOperationHistoryForAccount(accountId, operations, nextPagingToken?)` also available.
  - **transactional slice**: Pending operations applied via `loadAccountData.fulfilled` / `loadOperationHistory.fulfilled` or `setPendingOperationsForAccount` / `addPendingOperationForAccount`.
  - **balanceHistory slice**: `setBalanceHistoryForAccount(accountId, history)`.
  - **accountCoinResources slice** (placeholder): store all coin extras (bitcoinResources, tezosResources, nfts, etc.).
- **Bridge full sync enriches all stores**: When we **load accounts via the bridge** (legacy path), we already have the full **Account** (operations, balanceHistoryCache, etc.). We dispatch into **operationHistory** and **balanceHistory** from that same sync result so the Operations and Balance history sections **do not need a separate reload** — one full sync fills every slice.
- **Reconstruction**: Rebuild the full **Account** from: accounts + operationHistory + balanceHistory + **accountCoinResources** (placeholder) (+ swapHistory when in scope). The caller uses accountCoinResources when reconstructing for the bridge. **Top-level selectors** (see §2.1) provide a sync selector for the reconstruction inputs and an async hook pattern for the full **Account** so the UI can depend on a single account view. In this POC there is no send flow, so reconstruction is only for sync. The Alpaca path does not need reconstruction for its slice-optimized fetches.

Summary: **Single sync output (Account) → split into slices on dispatch; single “full Account” only when calling the bridge. When using the bridge, one account load enriches every store so no extra reload is needed.**

**Important**: The `loadAccountData` thunk (shared) is for the **legacy (bridge) path** only: one full sync fills all slices. On the **Alpaca path** we do **not** "tout load"; each section (account card, operations list, balance history) triggers its own slice-optimized fetch.

---

## 4. Branching at the Slice Level: Bridge vs Alpaca

We allow an **alternative integration path per coin family**:

- **Legacy path**: Use the **bridge** (e.g. `getCurrencyBridge` / `getAccountBridge`) as today. Sync returns a full **Account**; we then split and dispatch into the v4 slices.
- **Optimized path (POC candidate: EVM)**: For **coin-evm** (and coins using the same pattern), we use a **minimized sync** that talks directly to the **Alpaca-style API** (e.g. `getBalance`, `listOperations`, etc.), inspired by the **bridge alpaca adaptor** (`libs/ledger-live-common/src/bridge/generic-alpaca/`). Each slice can be fed without building a full **Account** first:
  - **accounts slice**: minimal account + balances from Alpaca.
  - **operationHistory slice**: from `listOperations` (or equivalent).
  - **balanceHistory slice**: see §6 Balance history below. Today it is derived from operations + balance; same in this POC (including Alpaca-driven). Future: dedicated API.

For **other coin families** we keep using the **legacy bridge** and the “reconstruct Account when needed” approach above.

**POC scope**: Assume **coin-evm** is the candidate for the Alpaca/minimized interface; all other families use the legacy bridge. Implementation should make it easy to plug in the alpacaized interface (e.g. adaptors inspired by `generic-alpaca`) without duplicating UI.

**Sync trigger**:
- **Bridge path**: Sync runs when **any** slice needs a data refresh (e.g. balance or operations). Both balance and operations needs trigger the same full sync, since the bridge returns one **Account**.
- **Alpaca path**: Only **fetch the necessary part** (e.g. only the slice that is being refreshed).

---

## 5. Account import and “accounts being used”

- **Import by account ID**: One input field to enter an account id (same idea as the Sync page, `apps/web-tools/src/pages/sync.tsx`), plus an **[ADD]** button. On [ADD], validate/normalize the id (e.g. via `decodeAccountId` or an `inferAccountId`-style helper as in sync.tsx) and add it to the list of **accounts being used**. That list is the set of account ids the playground will sync and display.
- **Wallet Sync import (optional)**: User can pull account ids from Wallet Sync (e.g. from a connected device). The input used for “account ids” has `name="account-ids"` so the browser can save/restore it. Member credentials are not persisted; each import obtains fresh credentials from the device. See `walletSyncImport.ts`.
- No need to auto-sync on paste; the user explicitly adds ids, then uses LOAD/REFRESH per section to fetch data.

---

## 6. UI Features (per slice)

UI should mimic the app lightly; keep it minimal. Each section has a **LOAD / REFRESH** action that triggers the underlying load logic:

- **Bridge path**: LOAD/REFRESH triggers a **full sync** for the selected account(s); we then split the returned **Account** into slices and dispatch. Reconstruction is used whenever we call the bridge (it only understands **Account**).
- **Alpaca path**: LOAD/REFRESH triggers only the **slice-optimized** fetch (e.g. only balance, or only operations, or only what’s needed for that section).

Sections:

- **Account display (accounts slice)**  
  Show balance, name, address (or id), currency. Token accounts under parent as **AccountV4.subAccounts** (TokenAccountV4). A **LOAD/REFRESH** button runs the logic that fills the accounts slice (full sync for bridge, or minimal account+balance for Alpaca). On bridge path, this load also enriches operationHistory and balanceHistory so Operations and Balance history sections are already filled. Per-account load errors are shown on the failing account card; other accounts continue to load.

- **Account operations list (operationHistory slice)**  
  Operations are stored **by account id** in the operationHistory slice; token account operations live in the same store keyed by their **account id** (not on TokenAccountV4). UI: user selects **one account or one token account**; ops are shown for that id only. **LOAD/REFRESH** loads operations for the selected account (full sync for bridge, or slice fetch for Alpaca). **Pagination**: first page (e.g. 20 ops) is shown; a **Load more** button appears when there are more (client-side when the API returns all ops at once, server-side when it returns `nextPagingToken`). After a bridge account load, ops are already in the store so no separate operations load is needed.

- **Account balance history (balanceHistory slice)**  
  Mini graph (or tabular) for balance over time. **Balance history today** is **derived state** calculated from operations + balance; we do the same here in the POC (bridge and Alpaca-driven). Use a derived/placeholder implementation that builds the balance history from balance + operations (e.g. in the slice or a small helper). **Document in code** that in the future this will be a **dedicated balance history API**; keep the derivation logic localized in the slice/playground for now. After a bridge account load, balance history is already in the store so no separate balance history load is needed.

**Explicitly out of scope for this POC**: Swap history UI and any swap-specific flows.

---


## 7. TO BE DISCUSSED

### WIP and placeholders in this playground

- **accountCoinResources** is a **temporary placeholder** (see §2). All coin-specific extras (bitcoinResources, tezosResources, etc.) live there; target later is one slice per coin family.
- **Balance history** is **derived** from operations + balance in this POC. It is documented as future **dedicated API**; the derivation logic is local to the playground.
- **Operations pagination**: UI supports “Load more” (client-side or server-side when the API returns `nextPagingToken`). Backend support for `limit` / `lastPagingToken` may still be partial; behavior is prepared for when Alpaca (or equivalent) fully supports it.
- **Reconstruction** from slices is **async** when tokens are involved (`findTokenById`). Callers that need a full **Account** for the bridge must await `reconstructAccountFromSlices`. **Top-level selectors** (§2.1) expose a sync selector for reconstruction inputs and recommend a hook (e.g. `useReconstructedAccount`) for UI that needs the full legacy **Account**.
- **AccountV4** still contains fields that likely belong to other domains and should be split out: key chain–related, blockchain-related, sync management–related.
- **pendingOperations** live in the **transactional** slice (`pendingOperationsByAccountId`); **operationHistory** holds only confirmed operations.

### Serializability tradeoff: no Token / Currency / BigNumber in the stored model

To keep the Redux state **serializable** (e.g. for persistence, DevTools, or future sync), we **do not** store **Token** (TokenCurrency), **Currency** (CryptoCurrency), or **BigNumber** in the slices:

- **Accounts**: we store **currencyId** and **tokenId** (and **feesCurrencyId**) instead of `currency` / `token` / `feesCurrency`. **Balance** and **spendableBalance** are stored as **strings** (parsed to BigNumber only when needed).
- **Operations**: we store **value** and **fee** (and **transactionSequenceNumber**) as **strings**; same idea, parse to BigNumber at use site.

**Consequence**: the **UI (and any code that needs “full” objects)** must **resolve** every time:

- **Currency**: `getCryptoCurrencyById(account.currencyId)` (sync).
- **Token**: `getCryptoAssetsStore().findTokenById(tokenAccount.tokenId)` (async).
- **Balances / op amounts**: `new BigNumber(account.balance)`, `new BigNumber(op.value)`, etc., when formatting or computing.

Reconstruction of the full **Account** for the bridge also does these lookups (sync for currency, async for tokens and feesCurrency).

This **tradeoff** (serializable store vs. resolution cost and async where tokens are involved) is intentional for the POC and **needs to be discussed** for production: e.g. caching of resolved currencies/tokens, or accepting non-serializable state in parts of the app, vs. keeping a fully serializable store and paying the resolution cost at read time.

---

**Implementation**: The above is the full spec; §7 captures open points and tradeoffs to be discussed. Implementation can proceed from §1 (structure) through §6.

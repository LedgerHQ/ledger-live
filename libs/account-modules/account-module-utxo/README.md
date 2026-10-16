# @ledgerhq/account-module-utxo

> [!CAUTION]
> **Status: UNSTABLE** — Proof of concept of ADR-064 Option 1; API may change. Destined for LedgerHQ/coin-modules.

The `AccountModuleApi` (from `@ledgerhq/account-module-framework`) of UTXO chains: an account is an extended public key
whose funds sit on the addresses of its HD chains (receive and change). It is the generic half of what Ledger Wallet's
bitcoin bridge did, with no chain specific code: bitcoin, and any bitcoin-like coin module, plugs in through a port.

## What the module owns

- the gap walk over the receive and change chains, resumed a few blocks below the last synced tip, started over on a
  reorg below its anchor;
- the history of every address, each transaction interpreted once against the whole address set (OUT net of the change,
  IN on a non-change address, or on any of its addresses when the account spends nothing, both for a self-send);
- the UTXO set (confirmed, then the mempool applied) and the replaced-transaction rules (an outpoint is spent once: the
  confirmed spend wins, then the higher block; stale unconfirmed operations expire);
- the write path: the outputs coin selection may use (confirmed, or unconfirmed change; never excluded, never reserved
  by a pending send), the change address, the signing path of each input, and replacements (the replaced transaction's
  inputs spent again, the conflicting pending ones listed);
- the optimistic operation of a send, and its settlement.

## Interface

Full declarations: [src/types.ts](src/types.ts).

```ts
function createUtxoAccountModule(api: UtxoCoinModuleApi, options?: UtxoAccountModuleOptions): UtxoAccountModuleApi;

type UtxoAccountModuleOptions = {
  receiveChain?: number;  // 0
  changeChain?: number;   // 1
  gapLimit?: number;      // 20 unused addresses walked past the last used one
  rewindBlocks?: number;  // 6 blocks read again below the last synced tip
  replacedOperationExpiryMs?: (context: Context<any>) => Promise<number | undefined>;
  now?: () => number;
};

type UtxoAccountModuleApi = AccountModuleApi<UtxoAccountTypes> & {
  // (context, account, options?: { filter?: (utxo: Utxo) => boolean; refresh?: boolean }) => Promise<AccountRead<Utxo[]>>
  getUTXOs: NonNullable<AccountModuleApi<UtxoAccountTypes>["getUTXOs"]>;
  /** Write path: from the stored state, never refreshed. */
  getChangeAddress(context, account): Promise<{ address: string; derivationPath: string }>;
};

interface UtxoAccountTypes extends AccountTypes { state: UtxoAccountState; options: UtxoAccountOptions; utxo: Utxo }

type UtxoAccountOptions = {                         // AccountIntent.accountOptions
  excludedUtxos?: Array<{ txid: string; vout: number }>;
  strategy?: unknown;                               // coin selection strategy, as the coin module names it
  replaceTxId?: string;                             // pending transaction to replace (speed up, cancel)
};

type Utxo = { txid: string; vout: number; value: bigint; address: string; derivationPath: string;
  height: number | null; replaceable: boolean; change: boolean };
```

### The port: what the coin module provides

`UtxoCoinModuleApi` is `CoinModuleApi`'s `lastBlock`, `getBlockInfo`, `combine` and `broadcast`, its `estimateFees`,
`validateIntent` and `craftTransaction`, and optionally `craftTransactionData`, on intents the module completed
(`UtxoCoinIntent`, whose `data` is always set), and these stateless, per-address primitives. `coin-bitcoin` implements it structurally, without
depending on this package.

```ts
type UtxoPrimitives = {
  /** The addresses of the gap walk, the fresh and change addresses. */
  deriveAddress(context, request: { key: string; derivationMode: string; chain: number; index: number }): Promise<string>;
  /** Whole transactions (every input and output), to tell change from payment; mempool on the first page. */
  listAddressTransactions(context, address: string, options: ListOperationsOptions): Promise<Page<UtxoTransaction>>;
  /** What a replacement spends again. */
  getTransaction(context, txid: string): Promise<Pick<UtxoTransaction, "id" | "fees" | "inputs" | "outputs">>;
  /** Coin selection with the chain's size and fee maths. */
  selectInputs(context, request: { intent: UtxoCoinIntent; candidates: UtxoCandidate[];
    strategy?: unknown; customFeesParameters?: Record<string, unknown> }): Promise<Array<{ txid: string; vout: number }>>;
  /** Addresses as the account shows them (e.g. cashaddr without prefix). */
  displayAddress?(address: string): string;
};

type UtxoTransaction = {
  id: string; receivedAt: string; block: { height: number; hash: string; time: string } | null;
  fees: string; replaceable: boolean;
  inputs: Array<{ txid?: string; vout: number; address?: string; value: string; sequence?: number }>; // no txid: coinbase
  outputs: Array<{ index: number; address?: string; value: string }>;                               // no address: OP_RETURN, ...
};
```

The completed intent carries `UtxoIntentData` (inputs with their signing paths, change, derivation mode, replacement),
and `craftTransaction` returns a `CraftedTransaction` whose `details` are `UtxoCraftedDetails` (spent outpoints, fee,
amount, senders, recipients, and optionally replaceable).

## State

`UtxoAccountState` (version `UTXO_ACCOUNT_STATE_VERSION`, 2) is small and rebuildable: the synced height, the reorg
anchor, the addresses holding history, the confirmed outputs, the unspent outputs, and `refreshedAt`, the epoch-ms time
of the last walk of the addresses (0: never). It lives in the client's `StateStore` (`account.state`): `sync` puts the
state its walk completes; a failed walk keeps the stored one. A version 1 state (no `refreshedAt`) is migrated as it is
read, with `refreshedAt` 0: never known; a state of another version, or malformed, is not trusted: the account syncs
from scratch. The write path of an account without state rejects with `UtxoAccountNotSyncedError`.

```ts
type UtxoAccountState = {  // UTXO_ACCOUNT_STATE_VERSION = 2
  syncedHeight: number;                              // tip of the last walk; the next one resumes rewindBlocks below
  anchor: { height: number; hash: string } | null;   // highest block holding a transaction of the account
  addresses: UtxoAddressState[];                     // every address holding history
  confirmedUtxos: UtxoState[];
  utxos: UtxoState[];                                // mempool applied, replaced transactions removed
  refreshedAt: number;                               // epoch ms of the last walk; 0: never (v1 migrates with 0)
};
```

### Reads

Every read derives from the walk of the addresses: the account has one scope. A read answers from the stored state and
history, without any network call (`getFreshAddress` derives the next address, with no network), and `updatedAt` is the
time of the last walk. With `refresh: true`, it walks the addresses first exactly as `sync` does (the whole account is
refreshed and stored) and answers fresh, without `updatedAt`. `getStakes` answers no stake, always fresh: `refresh` does
nothing. The write path (`getChangeAddress` included) reads the stored state and never refreshes it.

The pure pieces are exported too: `completeIntent`, `txToOperations`, `removeReplaced`
(`DEFAULT_REPLACED_OPERATION_EXPIRY_MS`, 2 hours), `applyTransactions`, `reconcile`, `selectableUtxos`,
`conflictingTransactions`, `outpointOf`, `inputsOf`, `readState` (the state in the current version, a version 1 one
migrated; `undefined` when not trusted), `storedState`, `emptyState`, `versioned`.

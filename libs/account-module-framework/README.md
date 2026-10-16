# @ledgerhq/account-module-framework

> [!CAUTION]
> **Status: UNSTABLE** — Proof of concept of ADR-064 Option 1; API may change. Destined for LedgerHQ/coin-modules.

The contract of the account layer (ADR-064 Option 1): `AccountModuleApi`, the stateful, account-level API on top of the
stateless, per-address `CoinModuleApi` of `@ledgerhq/coin-module-framework`.

```
PortfolioApi        cross-chain: a portfolio of accounts          @ledgerhq/portfolio-module-*
     │ delegates
AccountModuleApi    one Ledger Wallet account, one or many addresses  @ledgerhq/account-module-*
     │ delegates
CoinModuleApi       one address, stateless primitives               @ledgerhq/coin-*
```

An account module owns what only the whole account knows — its addresses, its history across them, its pending
operations, the inputs and change of a UTXO send — and delegates every chain detail to its coin module, so it holds no
blockchain specific code. Implementations: `@ledgerhq/account-module-single-address` (the account is one address) and
`@ledgerhq/account-module-utxo` (an extended public key whose funds sit on many derived addresses).

## Interface

Stateless functions: the state is passed in and returned, the history goes through a store the client provides, nothing
is kept between calls. Full declarations: [src/types.ts](src/types.ts).

```ts
type AccountModuleApi<T extends AccountTypes = AccountTypes> = {
  sync(context, account, options?: { signal?: AbortSignal }): AsyncIterable<SyncEvent<T["state"]>>;

  // reads: state and history only, no network call
  getBalances(context, account): Promise<Balance[]>; // per asset, never per address or UTXO
  listOperations(context, account, options?: { cursor?: Cursor; limit?: number }): Promise<Page<AccountOperation>>;
  getPendingOperations(context, account): Promise<AccountOperation[]>;
  getStakes(context, account): Promise<Stake[]>;
  getUTXOs?(context, account, filter?: (utxo: T["utxo"]) => boolean): Promise<T["utxo"][]>;
  getAddresses(context, account): Promise<AccountAddress[]>;
  getFreshAddress(context, account): Promise<{ address: string; derivationPath: string }>;

  // write path
  estimateFees(context, account, intent: AccountIntent<T["options"]>, options?: AccountFeeOptions): Promise<FeeEstimation>;
  validateIntent(context, account, intent, options?: { customFees?: FeeEstimation }): Promise<TransactionValidation>;
  estimateMaxSpendable(context, account, intent, options?: AccountFeeOptions): Promise<bigint>;
  craftTransaction(context, account, intent, options?: { customFees?: FeeEstimation }): Promise<CraftedAccountTransaction>;
  combine(context, account, crafted: CraftedAccountTransaction, signatures: string[], options?: { pubkey?: string }): Promise<string>;
  broadcast(context, account, signedTransaction: string, crafted: CraftedAccountTransaction,
    options?: { broadcastConfig?: BroadcastConfig }): Promise<AccountOperation>; // records the optimistic operation
};
// context: Context<any> (coin-module-framework), account: AccountData<T["state"]>

interface AccountTypes { state: JsonValue; options: unknown; utxo: unknown }

type AccountData<State extends JsonValue = JsonValue> = {
  descriptor: AccountDescriptor;
  state: Versioned<State> | undefined; // undefined: never synced
  history: HistoryStore;               // provided by the client
};

type AccountDescriptor = {
  currencyId: string;
  derivationMode: string; // "", "segwit", "native_segwit", "taproot", ...
  index: number;
  key: string;            // extended public key, or the address of a single-address account
  derivationPath: string; // account level, e.g. "84'/0'/0'"
};

interface HistoryStore {
  upsert(operations: AccountOperation[]): Promise<void>;
  remove(operationIds: string[]): Promise<void>;
  list(options?: { cursor?: Cursor; limit?: number }): Promise<Page<AccountOperation>>; // newest first
}

type AccountOperation = {
  id: string; hash: string; type: string; // "IN", "OUT", "FEES", ...
  value: bigint;                          // absolute balance change of the whole account in `asset`, fee included when paid in it
  fee: bigint; asset: AssetInfo; senders: string[]; recipients: string[];
  feesPayer?: string;                     // who paid the fee, when the chain says
  memo?: unknown;                         // the coin module's structured Operation.memo
  block: { height: number; hash: string; time: Date } | null; // null: not in a block yet
  date: Date; failed: boolean;
  optimistic?: boolean;                   // recorded by broadcast, not seen on the network yet
  details?: Record<string, unknown>;      // module data: spent outpoints, nonce, ...
};

type AccountIntent<Options = unknown> = Omit<TransactionIntent, "sender" | "senderPublicKey"> & {
  sender?: string; senderPublicKey?: string; // set from the account when absent
  memo?: Memo; data?: TxData;
  accountOptions?: Options;                  // coin control, the transaction to replace, ...
} & Record<string, unknown>;

type CraftedAccountTransaction = CraftedTransaction & { operation: AccountOperation };
type SyncEvent<State extends JsonValue = JsonValue> = { state: Versioned<State>; progress: { blockHeight?: number; counters?: Record<string, number> } };
type Versioned<T extends JsonValue = JsonValue> = { version: number; data: T };
```

## Helpers

- `discoverAccounts(module, context, request)`: the add-account scan, account index after account index, each account
  synced, up to and including the first empty account (yielded with `empty: true`).
- `createMemoryHistoryStore`, `readHistory`, `paginate`, `compareNewestFirst`: history helpers.
- `toJsonOperation` / `fromJsonOperation`, `toJsonBalance` / `fromJsonBalance`, `toJsonStake` / `fromJsonStake`:
  JSON forms (`JsonOperation`, `JsonBalance`, `JsonStake`) for persistence. `JsonOperation` is structurally
  portfolio-module-framework's `OperationView`.
- `toJsonSafe(value)`: the one JSON form of module data whose shape the caller does not know, what
  `JSON.parse(JSON.stringify(value))` gives except that bigints and BigNumbers (any bignumber.js copy, duck-typed)
  become decimal strings without exponent. Dates become ISO strings, Buffers `{ type, data }`, Maps and Sets `{}`;
  `undefined` fields and functions are dropped, a top-level `undefined` is `null`; a circular value throws.
- `FEE_INCLUSIVE_OPERATION_TYPES`: the types whose native value includes the fee (OUT, FEES, DELEGATE, UNDELEGATE,
  REDELEGATE, CONTRACT_CALL, UPDATE_ACCOUNT); the coin module's value otherwise.
- `settleOptimisticOperations(history, { now?, expiryMs?, isSettled? })`: drops the optimistic operations whose
  transaction a sync has seen (same hash, confirmed or not), those older than `expiryMs` (default
  `DEFAULT_OPTIMISTIC_EXPIRY_MS`, 2 hours), and those the caller's `isSettled` marks as settled (replaced, double spent).
- `accountIdOf`: the account id shared with Ledger Wallet (`js:2:<currency>:<key>:<mode>`).
- `accountDerivationPath(scheme, index)`: the account-level path, e.g. `"84'/0'"` and `3` → `"84'/0'/3'"`.
- `@ledgerhq/account-module-framework/test-utils`: `testContext`, `anOperation`.

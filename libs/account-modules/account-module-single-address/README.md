# @ledgerhq/account-module-single-address

> [!CAUTION]
> **Status: UNSTABLE** — Proof of concept of ADR-064 Option 1; API may change. Destined for LedgerHQ/coin-modules.

The default `AccountModuleApi` (from `@ledgerhq/account-module-framework`) of the address-based
families: the account is one address, `descriptor.key`. It is the sync of Ledger Wallet's generic
coin-framework bridge, without any Ledger Wallet type: amounts are `bigint`, no `bignumber.js`, no
rxjs, no `@ledgerhq/types-live`.

## What the coin module does

The module holds no blockchain specific code. Every chain detail goes through the injected
`CoinModuleApi` (any one satisfies `SingleAddressCoinModule`):

- sync: `lastBlock`, `getBalance` (with `balanceOptions` when the module has some) and `getStakes`
  with `includeStakes`, read together as the bridge reads them, then `listOperations` (every page,
  `order: "desc"` as the bridge lists)
- write path: `craftTransactionData`, `estimateFees`, `validateIntent`, `getNextSequence`,
  `craftTransaction`, `combine`, `broadcast`

The account layer adds what a single address does not know: the history, pending operations, the
next sequence past the pending ones, the max spendable, the optimistic operation of a broadcast.

## State and history

`SingleAddressAccountState` (version `SINGLE_ADDRESS_ACCOUNT_STATE_VERSION`, 2) is small, JSON safe and rebuildable: the
tip of the last refresh of the operations, the balances, the stakes, and the time of the last refresh of each scope. It
lives in the client's `StateStore` (`account.state`): the module reads it there and puts each new one back. A version 1
state (no refresh times) is migrated as it is read, its times 0: never known. A state of another version, or malformed,
is not trusted and the account syncs from scratch.

The account has three scopes, each refreshed at once:

| scope        | network calls                                              | reads                                                    |
| ------------ | ---------------------------------------------------------- | -------------------------------------------------------- |
| `balances`   | `getBalance`                                               | `getBalances`                                            |
| `stakes`     | `getStakes`, every page (with `includeStakes` only)        | `getStakes`                                              |
| `operations` | `lastBlock`, `listOperations`; the optimistic ones settled | `listOperations`, `getPendingOperations`, `getAddresses` |

`sync` refreshes them all and puts the new state once every one is read; a read with `refresh: true` refreshes its own
scope only, and keeps the others as stored. Without `refresh`, a read answers from the stored state and history, without
any network call, with `updatedAt` the time of its scope's last refresh (`now`, by a sync or a read; 0: never).
`getAddresses` answers the account key, used once the operations hold one. `getFreshAddress` derives from the
descriptor, and `getStakes` without `includeStakes` answers no stake: always fresh (no `updatedAt`), `refresh` does
nothing.

A refresh of the operations resumes above the highest block of the history, like the bridge does, and writes the
operations once every page is read, so that an interrupted one is not resumed past what it missed. The listing follows
the `Page` contract: it goes on past an empty page that carries a cursor, and stops on a cursor already followed. A
listing from scratch removes the operations it no longer returns. Optimistic operations are settled when their hash is
synced, their sequence is taken by a synced transaction, or they expire. A `getBalance` failure fails the sync, before
any listing, as an `UnexpectedGetBalanceError` (`@ledgerhq/coin-module-framework/errors`) whose `cause` is the coin
module's error, as the bridge's legacy path wraps it.

Each operation is the coin module's, as the bridge reads it: a failed incoming one (by
`details.ledgerOpType` when the module gives one, its `type` otherwise) is left out; the native value
of a sent one includes its fee (`FEE_INCLUSIVE_OPERATION_TYPES`); `feesPayer` and the structured
`memo` are copied beside `details`, which stays the module's own.

## Write path

The coin intent is sent by the account; its `data` is the intent's own, or the coin module's
`craftTransactionData` when the intent carries none (a throw fails the call).

`validateIntent` checks the intent against the balances of the stored state, the ones its last
refresh stored; the write path never refreshes it. Pending spends are the client's concern: a client
that wants them locked writes them into the state it stores (Ledger Wallet does).

## Usage

```ts
import { createSingleAddressAccountModule } from "@ledgerhq/account-module-single-address";

const accountModule = createSingleAddressAccountModule(coinModuleApi, {
  includeStakes: true,
  addressPath: ({ derivationPath }) => `${derivationPath}/0/0`,
});

// state: a StateStore the client persists (createMemoryStateStore in memory), history: a HistoryStore
const account = { descriptor, state, history };
for await (const { progress } of accountModule.sync(context, account)) report(progress);

const { value: balances, updatedAt } = await accountModule.getBalances(context, account); // stored, no network
const fresh = await accountModule.getBalances(context, account, { refresh: true }); // getBalance, stored, fresh
```

## Interface

Full declarations: [src/types.ts](src/types.ts).

```ts
function createSingleAddressAccountModule(
  coinModule: SingleAddressCoinModule,
  options?: SingleAddressAccountModuleOptions,
): AccountModuleApi<SingleAddressAccountTypes>;

/** What the module calls on its coin module: any whole `CoinModuleApi` satisfies it. */
type SingleAddressCoinModule = Pick<CoinModuleApi<any, any, any>,
  | "lastBlock" | "listOperations" | "getBalance" | "getStakes" | "getNextSequence"
  | "estimateFees" | "validateIntent" | "craftTransaction" | "combine" | "broadcast"
  | "craftTransactionData">;

type SingleAddressAccountModuleOptions = {
  includeStakes?: boolean;      // also reads getStakes
  optimisticExpiryMs?: number;  // age after which an optimistic operation is dropped
  now?: () => number;           // the refresh times and the optimistic operations' date
  addressPath?: (descriptor: AccountDescriptor) => string; // derivation path of the address; the account path by default
  balanceOptions?: BalanceOptions; // handed to getBalance on every refresh of the balances (EVM/Celo CAL filter includeAssets)
};

interface SingleAddressAccountTypes extends AccountTypes {
  state: SingleAddressAccountState;
  options: never;
  utxo: never;
}

type SingleAddressScope = "balances" | "stakes" | "operations";

type SingleAddressAccountState = {   // SINGLE_ADDRESS_ACCOUNT_STATE_VERSION = 2
  syncedHeight: number;              // tip of the last completed refresh of the operations; 0 until one completes
  balances: JsonBalance[];
  stakes: JsonStake[];               // empty unless includeStakes
  refreshedAt: Record<SingleAddressScope, number>; // epoch ms of each scope's last refresh; 0: never (v1 migrates with 0)
};
```

State helpers: `readState(versioned)` (the state in the current version, a version 1 one migrated; `undefined` when
not trusted), `storedState(store)` (the stored one, empty when none is trusted), `emptyState()`, `versioned(data)`.

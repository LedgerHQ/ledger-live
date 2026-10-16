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

`SingleAddressAccountState` (version `SINGLE_ADDRESS_ACCOUNT_STATE_VERSION`) is small, JSON safe and
rebuildable: the tip of the last completed sync, the balances and the stakes. A state of another
version, or malformed, is not trusted and the account syncs from scratch.

A sync resumes above the highest block of the history, like the bridge does, and writes the
operations once every page is read, so that an interrupted sync is not resumed past what it missed.
The listing follows the `Page` contract: it goes on past an empty page that carries a cursor, and
stops on a cursor already followed. A sync from scratch removes the operations the listing no longer
returns. Optimistic operations are settled when their hash is synced, their sequence is taken by a
synced transaction, or they expire. A `getBalance` failure fails the sync, before any listing, as an
`UnexpectedGetBalanceError` (`@ledgerhq/coin-module-framework/errors`) whose `cause` is the coin
module's error, as the bridge's legacy path wraps it.

Each operation is the coin module's, as the bridge reads it: a failed incoming one (by
`details.ledgerOpType` when the module gives one, its `type` otherwise) is left out; the native value
of a sent one includes its fee (`FEE_INCLUSIVE_OPERATION_TYPES`); `feesPayer` and the structured
`memo` are copied beside `details`, which stays the module's own.

Reads (`getBalances`, `getStakes`, `listOperations`, `getPendingOperations`, `getAddresses`,
`getFreshAddress`) never call the network.

## Write path

The coin intent is sent by the account; its `data` is the intent's own, or the coin module's
`craftTransactionData` when the intent carries none (a throw fails the call).

`validateIntent` checks the intent against the balances of the account's state, the ones its last
sync stored. Pending spends are the client's concern: a client that wants them locked writes them
into the state it stores (Ledger Wallet does).

## Usage

```ts
import { createSingleAddressAccountModule } from "@ledgerhq/account-module-single-address";

const accountModule = createSingleAddressAccountModule(coinModuleApi, {
  includeStakes: true,
  addressPath: ({ derivationPath }) => `${derivationPath}/0/0`,
});

for await (const event of accountModule.sync(context, { descriptor, state, history })) {
  persist(event.state);
}
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
  now?: () => number;
  addressPath?: (descriptor: AccountDescriptor) => string; // derivation path of the address; the account path by default
  balanceOptions?: BalanceOptions; // handed to getBalance on every sync (EVM/Celo CAL filter includeAssets)
};

interface SingleAddressAccountTypes extends AccountTypes {
  state: SingleAddressAccountState;
  options: never;
  utxo: never;
}

type SingleAddressAccountState = {   // SINGLE_ADDRESS_ACCOUNT_STATE_VERSION = 1
  syncedHeight: number;              // tip of the last completed sync; 0 until one completes
  balances: JsonBalance[];
  stakes: JsonStake[];               // empty unless includeStakes
};
```

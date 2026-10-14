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

- sync: `lastBlock`, `listOperations` (every page), `getBalance`, and `getStakes` with `includeStakes`
- write path: `estimateFees`, `validateIntent`, `getNextSequence`, `craftTransaction`, `combine`,
  `broadcast`

The account layer adds what a single address does not know: the history, pending operations, the
next sequence past the pending ones, the max spendable, the optimistic operation of a broadcast.

## State and history

`SingleAddressAccountState` (version `SINGLE_ADDRESS_ACCOUNT_STATE_VERSION`) is small, JSON safe and
rebuildable: the tip of the last completed sync, the balances and the stakes. A state of another
version, or malformed, is not trusted and the account syncs from scratch.

A sync resumes above the highest block of the history, like the bridge does, and writes the
operations once every page is read, so that an interrupted sync is not resumed past what it missed.
A sync from scratch removes the operations the listing no longer returns. Optimistic operations are
settled when their hash is synced, their sequence is taken by a synced transaction, or they expire.

Reads (`getBalances`, `getStakes`, `listOperations`, `getPendingOperations`, `getAddresses`,
`getFreshAddress`) never call the network.

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
  | "estimateFees" | "validateIntent" | "craftTransaction" | "combine" | "broadcast">;

type SingleAddressAccountModuleOptions = {
  includeStakes?: boolean;      // also reads getStakes
  optimisticExpiryMs?: number;  // age after which an optimistic operation is dropped
  now?: () => number;
  addressPath?: (descriptor: AccountDescriptor) => string; // derivation path of the address; the account path by default
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

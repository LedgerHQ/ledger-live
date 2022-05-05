# The account models

```
import {} from "@ledgerhq/live-common/lib/account";
```

**Semantic: What is an Account?**

An account refers to a wallet in wich a user detains assets of a given crypto currency.

Ledger Live model is essentially an array of `Account`, as many accounts can be created even within the same crypto currency.

More technically, an account is a view of the blockchain in the context of a specific user. While a blockchain tracks the series of transactions and assets activity that happen between addresses, an account interprets that from the point of view of a user who owns a set of addresses and wants to view the associated funds or perform transactions.

In the end, what the user wants to see is his balance, a historic graph, and a series of past operations that were performed. Nevertheless, moving from the blockchain to the concept of account is not a straightforward process (in blockchains like Bitcoin, the concept of account does not exist – you don't create or destroy, this concept is a view, a lense, that we abstract for the user).

**Semantic: What is an Operation?**

Note that we use the wording "Operation" instead of "Transaction". An account does not have transactions, it has **operations**.

The same abstraction applies for Account on top of blockchain: an Operation is a view of a transaction that happened in the blockchain, but from the point of view of an account. An operation always happens in the context of an account. In other words, an operation does not exist on its own.

Most of the time, a transaction "contains" one operation. But in some blockchains (like Ethereum) one transaction regarding the account's associated addresses can result in 0 to N operations. A typical example is a contract or a token transfer, where one transaction to move a token generate two operations in the Ethereum account: a token operation and a fee operation. Another example that is possible in most blockchains is a "self" transaction that contains two operations (sending out, sending in). But in fact, that's semantic, we, Ledger, have put. We could also have allowed the concept of "SELF" operation.

## The types

In live-common, there are currently 3 types of accounts that are defined in [types/account](../src/types/account.ts):

- `Account` which is a top level account associated to a `CryptoCurrency`.
- `TokenAccount` which is a nested level account, **inside** an Account and that is associated to a `TokenCurrency`.
- `ChildAccount` which is a variant of TokenAccount but more in context of a `CryptoCurrency` (typically used for Tezos)

Like for [Currency](./currency.md), we also have a discriminator `.type` field.

### Account

```js
type Account = {
  type: "Account",
  id: string,
  seedIdentifier: string,
  xpub?: string,
  derivationMode: DerivationMode,
  index: number,
  freshAddress: string,
  freshAddressPath: string,
  freshAddresses: Address[],
  name: string,
  balance: BigNumber,
  spendableBalance: BigNumber,
  blockHeight: number,
  currency: CryptoCurrency,
  unit: Unit,
  operationsCount: number,
  operations: Operation[],
  pendingOperations: Operation[],
  lastSyncDate: Date,
  subAccounts?: SubAccount[],
  balanceHistory?: BalanceHistoryMap
};
```

- `id` is a unique account identifier that we build up with many pieces of information. It's generally composed of 5 parts split by a `:` with:
  - `implementation` the implementation that the account is using (typically `js`). It directly maps the account to use the corresponding [AccountBridge](./AccountBridge.md).
  - `version` a version number required to allow a migration system (changing it usually will force a recalculation of operations).
  - `currencyId` tracks the unique id of currency.
  - `xpubOrAddress` is the "restore key" which is either an xpub or an address. Basically a way (combined with some other fields) to restore the account information.
  - `derivationMode` will be one of the derivation modes associated with the currency. See [derivation documentation](./derivation.md).
- `seedIdentifier` is a unique way to identify a seed associated with the account. The important criteria is it MUST be different between 2 seeds but it SHOULD be the same within siblings accounts inside a given `derivationMode`. We will usually use, in the context of BIP44, the pubKey at `purpose'/coinType'`. For other accounts that don't use BIP44, we have simply used the account address.
- `xpub` is the xpub if relevant. This information is redundant with the `id` and might be eventually dropped.
- `derivationMode` identifies the derivation scheme that is used. See [derivation documentation](./derivation.md). example of values: `segwit`, `unsplit`, `native_segwit`,...
- `index` is the index of the account among a given `derivationMode`.
- `freshAddress` is the "next" public address where a user should receive funds. In the context of Bitcoin, the address is "renewed" each time funds are received in order to allow some privacy. In other blockchains, the address might never change.
- `freshAddressPath` represents the ["derivation path"](./derivation.md) where the `freshAddress` was taken from.
- `freshAddresses` is an array of "future" fresh addresses. It is a generalization of `freshAddress` and `freshAddressPath` (which will eventually deprecate them).
- `name` is the name of the account that the user has set. It is not saved or restored from any place but is defined by the user and locally saved.
- `balance` represents the total amount of assets that this account holds.
- `spendableBalance` represents the subset of `balance` that can be spent. Most of the time it will be equal to `balance` but this can vary in some blockchains.
- `blockHeight` tracks the current blockchain block height.
- `currency` is the associated crypto currency of the Account.
- `unit` is the user defined preferred unit to view the account with. It's initialized to `currency.units[0]`.
- `operationsCount` gives the total number of operations this account contains. This field exists because the `operations` array is not guaranteed to be complete.
- `operations` is an array of operations sorted from the most recent to the oldest one. It might be partial, containing only the last N operations but can be paginated on.
- `pendingOperations` is like `operations` but only for _optimistic updates_ of operations resulting from transactions that were just performed and not yet confirmed by the backend (not in a mempool, not in a block). This allows pending "greyed out" operation in an operations list UI.
- `lastSyncDate` is the date of the last time a synchronization was performed, in other words tracks how up to date the Account data is.
- `subAccounts` is an optional field that is defined for accounts that can contain children accounts. This is for instance used for tokens and Tezos originated accounts.
- `balanceHistory` is a cache that contains the historical datapoints of the balance in different ranges of time. It might not be present in Account and in that case, a fallback JS implementation will be used to calculate this from the operations array.

#### Address

```js
type Address = {|
  address: string,
  derivationPath: string
|};
```

#### BalanceHistoryMap

TODO

#### Operation

TODO

### TokenAccount

```js
{
  type: "TokenAccount",
  id: string,
  parentId: string,
  token: TokenCurrency,
  balance: BigNumber,
  operationsCount: number,
  operations: Operation[],
  pendingOperations: Operation[],
  balanceHistory?: BalanceHistoryMap
}
```

TODO EACH SINGLE FIELD TO BE DETAILED

### ChildAccount

```js
{
  type: "ChildAccount",
  id: string,
  name: string,
  parentId: string,
  currency: CryptoCurrency,
  address: string,
  balance: BigNumber,
  operationsCount: number,
  operations: Operation[],
  pendingOperations: Operation[],
  balanceHistory?: BalanceHistoryMap
}
```

**Why does it differ from TokenAccount?**

First of all, `TokenAccount` is associated with a `TokenCurrency` which allows a series of constraints, not with a `CryptoCurrency`. 

The key differences are:
- A TokenAccount will always use the parent address to receive funds,
- A TokenAccount only exists in the context of the parent account and is highly associated with it. 

On the other hand:
- A ChildAccount is more standalone, 
- A ChildAccount has its own address (example of Tezos KT addresses).

Apart from this important distinction, the two notions share many concepts and fields, that's why we have `SubAccount` an union type between the two.

### union and utility types

```js
type SubAccount = TokenAccount | ChildAccount;

type AccountLike = Account | SubAccount;

type AccountLikeArray =
  | AccountLike[]
  | TokenAccount[]
  | ChildAccount[]
  | Account[];
```

> NB: `AccountLikeArray` is here because `AccountLike[]` does not practically works because FlowType limitation.

## "Raw types"

In order to allow serialization of the types displayed above we need to have intermediary conversion types (suffixed by `*Raw`) that we can directly JSON.stringify and save to a database and symmetrically load up back into the original types.

Therefore, we introduce these types:

```js
type TokenAccountRaw = ...;
type ChildAccountRaw = ...
type AccountRaw = ...;
type OperationRaw = ...;
// as well as union types
type SubAccountRaw = TokenAccountRaw | ChildAccountRaw;
type AccountRawLike = AccountRaw | SubAccountRaw;
```

Typically, BigNumber will be serialized to a decimal string.

This indirection also allows us the flexibility to ease backward compatibility: **we must guarantee that existing raw objects from 6 months ago are still supported** to avoid having a complex migration system. The convention is to never change a field name, and to make any new field "**optional**" (`field?: T`). This allows us to support the absence of such new fields, which typically would be "defaulted" during the conversion back to the main types. This way, we can forget about this problem and sometimes do breaking change in the main model without breaking the raw version.

From a user perspective, you don't need to worry about them and live-common offers utility to convert them in [`account/serialization`](../src/account/serialization.ts).

## The account logic

=> TODO some of these will move in AccountBridge

### Scan Accounts

...

### Synchronization

The action to update Account data is called a Synchronization.

### Convention with sub accounts

An account can have sub accounts.
A sub account can be either a token account or a child account in some blockchain.

By convention, a `SubAccount` is living inside an `Account` but is not an entity that exists on its own. Therefore, there is no `.parentAccount` in it, which will mean you will need to always have a tuple of `(parentAccount, account)`.
We will transport that `(parentAccount, account)` everywhere because a sub account is not enough and you need the full context with this tuple.

These are two valid examples:

- I'm inside a ZRX token account of Ethereum 1: `{ parentAccount: Ethereum 1, account: ZRX }`
- I'm just inside the Ethereum 1: `{ account: Ethereum 1, parentAccount: undefined }`

`"account"` is the primary account that you use/select/view. It is a `AccountLike`.

`"parentAccount"`, if available, is the contextual account. It is a `?Account`.

In a denormalized form, we may use the naming `(parentId, accountId)`.

...

## The portfolio logic

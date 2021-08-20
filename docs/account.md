# The account models

```
import {} from "@ledgerhq/live-common/lib/account";
```

**Semantic: What is an Account?**

An account represents a wallet where a user detains crypto assets for a given crypto currency.

Ledger Live model is essentially an array of `Account` because many accounts can be created, even within a same crypto currency.

More technically, an account is a view of the blockchain in the context of a specific user. While blockchain tracks the series of transactions, assets motions that happen between addresses, an account essentializes that from the point of view of a user that owns a set of addresses and wants to view the associated funds they detain and be able to perform transactions with it.

Essentially what the user wants to see at the end is his balance, a historic graph, and a series of past operations that were performed. Moving from the blockchain to the concept of account is not necessarily trivial (in blockchains like Bitcoin, the concept of account does not exist – you don't create or destroy, this concept is a view, a lense, that we abstract for the user).

**Semantic: What is an Operation?**

Note the wording "Operation" is used instead of "Transaction". An account does not have transactions, it has **operations**.

The same abstraction applies as for Account on top of blockchain: an Operation is a view of a transaction that happened in the blockchain that **concerns** the contextual account. It's always in the context of an account, in other words, an operation does not exist on its own.

Most of the time, a transaction yield of one operation. But in some blockchains (like Ethereum) one transaction that concerns the account associated addresses can result in 0 to N operations. A typical example is contract or token transfers (one transaction to move a token generate a token operation and a fee operation in the ethereum account). Another example that is possible in most blockchains is a "self" transaction yields two operations (sending out, sending in). But in fact, that's semantic, we, Ledger, have put. We could also have allowed the concept of "SELF" operation.

## The types

In live-common, there are currently 3 types of accounts that are defined in [types/account](../src/types/account.ts):

- `Account` which is a top level account associated to a `CryptoCurrency`.
- `TokenAccount` which is a nested level account, **inside** an Account and that is associated to a `TokenCurrency`.
- `ChildAccount` which is a variant of TokenAccount but more in context of a `CryptoCurrency` (typically used for Tezos)

Like for [Currency](./currency.md), we have also a discriminator `.type` field.

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

- `id` is a unique account identifier we build up with many pieces of information. It's generally composed of 5 parts split by a `:` with:
  - `implementation` the implementation the account is using (typically `js` or `libcore`). It would directly map the account to use the corresponding [AccountBridge](./AccountBridge.md).
  - `version` a version number we have to allow for a migration system (changing it usually will force a recalculation of operations).
  - `currencyId` tracks the unique id of currency.
  - `xpubOrAddress` is the "restore key" which is either an xpub or an address. Basically a way (combined with some other fields) to restore the account information.
  - `derivationMode` will be one of the derivation modes associated to the currency. See [derivation documentation](./derivation.md).
- `seedIdentifier` is a unique way to identify a seed the account was associated with. The important criteria is it MUST be different between 2 seeds but it SHOULD be the same within siblings accounts inside a given `derivationMode`. We usually will use, in the context of BIP44, the pubKey at `purpose'/coinType'`. For other accounts that don't use BIP44, we have simply used the account address.
- `xpub` is the xpub if relevant. This information is redundant with the `id` and might be eventually dropped.
- `derivationMode` identify the derivation scheme that is used. See [derivation documentation](./derivation.md). example of values: `segwit`, `unsplit`, `native_segwit`,...
- `index` is the index of the account among a given `derivationMode`.
- `freshAddress` is the "next" public address where a user should receive funds. In the context of Bitcoin, the address will be "renewed" each time funds were received in order to allow some privacy. In other blockchains, it might never change.
- `freshAddressPath` represents the ["derivation path"](./derivation.md) where the `freshAddress` was taken from.
- `freshAddresses` is an array of "future" fresh addresses. It is a generalisation of `freshAddress` and `freshAddressPath` (which will eventually deprecate them).
- `name` is the name of the account that the user has set. It is not saved or restored from any place but is defined by the user and locally saved.
- `balance` represent the total amount of assets that this account holds.
- `spendableBalance` represents the subset of `balance` that can be spent. Most of the time it will be equal to `balance` but this can vary in some blockchains.
- `blockHeight` tracks the current blockchain block height.
- `currency` is the associated crypto currency of the Account.
- `unit` is the user defined preferred unit to view the account with. It's initialized to `currency.units[0]`.
- `operationsCount` gives the total number of operations this account contains. This field exists because the `operations` array is not guaranteed to be complete.
- `operations` is an array of operations sorted from the most recent to the oldest one. It might be partial, containing only the last N operations but can be paginated on.
- `pendingOperations` is like `operations` but only for _optimistic updates_ of operations resulting from transactions that were just performed and not yet confirmed by the backend (not in a mempool, not in a block). This allows prepending "greyed out" operation in an operations list UI.
- `lastSyncDate` is the date of the last time a synchronisation was performed, in other words tracks how up to date the Account data is.
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

First of all, `TokenAccount` is associated with a `TokenCurrency` which allows a series of constraints, not to a `CryptoCurrency`. The key difference is a TokenAccount will always be using the parent address to receive funds, it only exists in the context of the parent account and is highly associated with it. ChildAccount, on the contrary, is more standalone, has its own address. (example of Tezos KT addresses)

Apart from this important distinction, the two concept share many concepts and fields, that's why we have `SubAccount` an union type between the two.

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

In order to allow serialization of the types displayed above we need to have intermediary conversion types (suffixed by `*Raw`) that we can directly JSON.stringify and save to a database and symetrically load up back into the original types.

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

This indirection also allows us the flexibility to ease backward compatibility: **we must guarantee that existing raw objects from 6 months ago are stilled supported** to avoid having a complex migration system. The convention is to never change a field name and each time we introduce fields, we make them optional (`field?: T`) in order to support the absence of it, which typically would be "defaulted" during the conversion back to the main types allowing us to forget about this problem and sometimes do breaking change in the main model (in respect of not breaking the raw version).

From user perspective, you don't need to worry about them and live-common offers utility to convert them in [`account/serialization`](../src/account/serialization.ts).

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
we will transport that `(parentAccount, account)` everywhere because a sub account is not enough and you need the full context with this tuple.

These are two valid examples:

- I'm inside a ZRX token account of Ethereum 1: `{ parentAccount: Ethereum 1, account: ZRX }`
- I'm just inside the Ethereum 1: `{ account: Ethereum 1, parentAccount: undefined }`

`"account"` is the primary account that you use/select/view. It is a `AccountLike`.

`"parentAccount"`, if available, is the contextual account. It is a `?Account`.

In a denormalized form, we may use the naming `(parentId, accountId)`.

...

## The portfolio logic

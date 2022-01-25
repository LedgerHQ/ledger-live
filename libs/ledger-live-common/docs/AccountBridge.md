# `AccountBridge`: synchronize an account and perform transaction

> - Prerequisite: [Account](./account.md).
> - See also: [gist: transaction with a Ledger device](./docs/gist-tx.md)

AccountBridge offers a generic abstraction to synchronize accounts and perform transactions.

It is designed for the end user frontend interface and is agnostic of the way it runs, has multiple implementations and does not know how the data is even stored: in fact **it's just a set of stateless functions**.

![](account-bridge-flow.png)

**[types](../src/types/bridge.ts)**

```js
export interface AccountBridge<T: Transaction> {
  receive(
    account: Account,
    { verify?: boolean, deviceId: string, subAccountId?: string }
  ): Observable<{
    address: string,
    path: string,
  }>;

  sync(Account, SyncConfig): Observable<(Account) => Account>;

  createTransaction(Account): T;

  updateTransaction(T, $Shape<T>): T;

  prepareTransaction(Account, T): Promise<T>;

  getTransactionStatus(Account, T): Promise<TransactionStatus>;

  estimateMaxSpendable({
    account: AccountLike,
    parentAccount?: ?Account,
    transaction?: ?T,
  }): Promise<BigNumber>;

  signOperation({
    account: Account,
    transaction: T,
    deviceId: DeviceId,
  }): Observable<SignOperationEvent>;

  broadcast({
    account: Account,
    signedOperation: SignedOperation,
  }): Promise<Operation>;
}
```

## `getAccountBridge`

`getAccountBridge` is the entry point to use to get a bridge instance for a given account.

```js
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

const bridge = getAccountBridge(account, parentAccount);
```

## Receive on an account

```js
receive(
  account: Account,
  { verify?: boolean, deviceId: string, subAccountId?: string }
): Observable<{
  address: string,
  path: string,
}>;
```

The first thing that AccountBridge allows to do is to receive on it.

the `receive` method allows to derivate address of an account with a Nano device but also display it on the device if verify is passed in.

## Synchronize an account with `sync`

This performs one "Account synchronization" which consists of refreshing all fields of a (previously created) Account from a server (blockchain explorer / nodes).

```js
sync(
  initialAccount: Account,
  syncConfig: SyncConfig
) => Observable<(Account) => Account>
```

The first parameter `initialAccount` is the account object as the frontend knows it. It will be used to determine what needs to be refreshed in the most minimal way possible (sync tries to preserve object references).

The second parameter allows to configure the synchronization (similarly to `CurrencyBridge#scanAccounts`). See [SyncConfig](../src/types/pagination.ts).

**The returned value is an `Observable` of updater function (`Account=>Account`). Let's dig a bit in this concept:**

**1. What is an Updater function?**

An updater function is a function that takes an Account and synchronously returned an **updated** copy of this Account. This is immutable: the initial object is not mutated and the copy will be a new object (with potentially shared object reference).

**2. Why do we need this Updater pattern?**

Basically to avoid race conditions.

We can't simply return an `Account` out of `sync` because synchronization can take time and in the meantime, the `initialAccount` original Account can have been modified by the user: for instance editing the Account name, changing any other settings,...
An updater function reconciliates a user update by applying the changes synchronously to the last up to date account object.

**3. Why is this an Observable and not a Promise?**

For two reasons at least:

- We want `sync()` to be interruptible. Observable allows subscriptions to be unsubscribed.
- More than one update might happen: Even though in practice only one function is emitted, it's more efficient for the UI that way at the moment but this might be refined in future. _This was also initially thought to have a "continuous" mode possible where a sync would keep emitting account updates in real time (this is not yet implemented)._

## Build a transaction

### What is `T: Transaction` parametric type?

The `AccountBridge` allow to create and perform blockchain transactions.

Each AccountBridge and typically each [cryptocurrency family](./currency.md) will have a great variety of fields. Different blockchains have different purposes: Bitcoin is a store of value, Ethereum is a smart contract system where you can also have tokens, Tezos have a delegation mechanism (Proof of Stake),...

As we want our _live-common_ library to be as typed as possible, we want to express this in types without having to define too much super type that would not scale many coin integrations. Each Bridge implementation, under the different [src/families](../src/families), can provide their own Transaction type.

The only "shared" type we expect at the moment (to enforce some convention) is

```js
type TransactionCommon = {|
  amount: BigNumber,
  recipient: string,
  useAllAmount?: boolean,
  subAccountId?: ?string,
|};
```

But then, each family will enhance it:

```js
// bitcoin/types.ts
type TezosTransaction = {|
  ...TransactionCommon,
  family: "bitcoin",
  feePerByte: ?BigNumber,
  networkInfo: ?BitcoinNetworkInfo,
|};

// tezos/types.ts
type TezosOperationMode = "send" | "delegate" | "undelegate";
type TezosTransaction = {|
  ...TransactionCommon,
  family: "tezos",
  mode: TezosOperationMode,
  networkInfo: ?TezosNetworkInfo,
  fees: ?BigNumber,
  gasLimit: ?BigNumber,
  storageLimit: ?BigNumber,
|};
```

**By defining the tezos account bridge as a `AccountBridge<TezosTransaction>`, we're essentially proving to our type system that you can't express an invalid transaction in all usage of the bridge.**

### `createTransaction` and `updateTransaction`

From the end user perspective, you need to be able to start a transaction and then fill up some data in it. The `T` parametric type is available from the inner implementation perspective, but on user land, if you use `getAccountBridge` you will lose the type precision. However, some methods are here to help you creating and updating the transaction data like a black box:

You can first get an initial transaction in context of an account using:

```js
createTransaction(account: Account): T;
```

Then, on a typically UI setup, user would update that object many times, via the use of:

```js
updateTransaction(t: T, patch: $Shape<T>): T;
```

Doing `newT = bridge.updateTransaction(t, { field: "value" })` is essentially like doing `newT = { ...t, field: "value" }` but with type safety.

### `prepareTransaction`

_prepare the remaining missing part of a transaction typically from network (e.g. fees) and fulfill it in a new transaction object that is returned._

```js
prepareTransaction(Account, T): Promise<T>;
```

It takes the contextual account of the transaction and any current transaction object (complete or partial) to resolve or "fill up" any missing information on that same Transaction.

A transaction often needs to be filled with some network calculation before user can even complete it: for instance, user should be able to pick among possible fees – which varies over time.

The `prepareTransaction` method is meant to contain **all network resolutions** that is required by the user for the transaction to be performed. (throws errors on network failure).

You must assume you need to recall this method EVERY TIME the transaction changes! Bridge implementation should implement cache or compare with previous transaction value to only refetch things if necessary.

**Reference stability:**

An important property of this method is to guarantee "reference stability": this is the idea that if nothing needs to be resolved anymore, the method should simply return back the same transaction reference. It also should resolve EVERYTHING (and should converge) and should not require the user to call twice the method to resolve it all.

In other words _(and in a Jest test that we actually have)_ this should be expected:

```js
async function expectStability(account, t) {
  const t2 = await bridge.prepareTransaction(account, t);
  const t3 = await bridge.prepareTransaction(account, t2);
  expect(t2).toStrictEqual(t3); // t2 === t3
}
```

### `getTransactionStatus`

_calculate derived state of the Transaction, useful to display summary / errors / warnings. tells if the transaction is ready._

```js
getTransactionStatus(
  account: Account,
  transaction: T
): Promise<TransactionStatus>;
```

As you update the transaction value, the user also wants fast feedback of what his transaction is going to do, if it's valid, if it misses information, how much fees it's going to cost,...

```js
type TransactionStatus = {|
  // potential error for each (user) field of the transaction
  errors: { [string]: Error },
  // potential warning for each (user) field for a transaction
  warnings: { [string]: Error },
  // estimated total fees the tx is going to cost. (in the mainAccount currency)
  estimatedFees: BigNumber,
  // actual amount that the recipient will receive (in account currency)
  amount: BigNumber,
  // total amount that the sender will spend (in account currency)
  totalSpent: BigNumber,
  // should the recipient be non editable
  recipientIsReadOnly?: boolean,
|};
```

This `TransactionStatus` containing the transaction validation (errors, warnings) and summary metadata useful for the user are all computed in a single place: `getTransactionStatus` that overall will tell if the transaction is ready to be signed.

> Important note: the Bridge does not offer any specific "calculate fees" or "is valid address" but instead this generalized method. Think of it the same way you would perform a global Form validation instead of a per field specific validation. Each currency having different purpose, it's easier to implement things in a simple place rather than providing custom methods.

By convention, a transaction can be performed if and only if `status.errors` is empty.

### `signOperation`

_finalizes a transaction by signing it with a Ledger device. This results of a "signed" event with a signedOperation than can be locally saved and later broadcasted._

```js
signOperation({
  account: Account,
  transaction: T,
  deviceId: DeviceId
}): Observable<SignOperationEvent>;
```

It returns an observable of SignOperationEvent events and can be interrupted at any time. It is however not recommended to interrupt it between `device-signature-requested` and `device-signature-granted` because there is no way to tell the device to discard the signature.

#### `SignOperationEvent`

During the signature with a Ledger device, there are many intermediary steps that are represented and emitted out of the observable.

```js
export type SignOperationEvent =
  // Used when lot of exchange is needed with the device to visually express a progress
  // It can be used before and/or after the signature
  // only used if it can takes >1s to show a visual progress to user (typically UTXO streaming)
  | { type: "device-streaming", progress: number, index: number, total: number } // optional
  // REQUIRED Indicates that a signature is now appearing and awaited on the device to confirm
  | { type: "device-signature-requested" }
  // REQUIRED Indicates user have confirmed the transaction
  | { type: "device-signature-granted" }
  // REQUIRED payload of the resulting signed operation
  | { type: "signed", signedOperation: SignedOperation };
```

**Example:**

![](https://user-images.githubusercontent.com/211411/71770088-30f8d580-2f29-11ea-94ff-14f308be7aa2.png)

#### `SignedOperation`

A `SignedOperation` is the result of an account transaction that has been signed by the device. It is composed of a "before broadcast" optimistic operation, a device signature and potentially a raw version form of that signature and an expirationDate.

```js
type SignedOperation = {|
  // prepared version of Operation before it's even broadcasted
  // .id/.hash is potentially not settled yet
  operation: Operation,
  // usually the device signature hex OR anything that is needed to broadcast (can be an inline JSON)
  signature: string,
  // sometimes a coin needs the raw object (it must be serializable)
  signatureRaw?: Object,
  // date calculated as expiring
  expirationDate: ?Date,
|};
```

### `broadcast`

_broadcasts a signed transaction to network, effectively pushing it to the blockchain nodes. (in order for a miner to include it later in a block)_

```js
broadcast({
  account: Account,
  signedOperation: SignedOperation
}): Promise<Operation>;
```

It returns an **optimistic** `Operation` that this transaction is likely to create in the future.

### `estimateMaxSpendable`

```js
estimateMaxSpendable({
  account: AccountLike,
  parentAccount?: ?Account,
  transaction?: ?Transaction
}): Promise<BigNumber>;
```

is a heuristic that provides the **estimated** max amount that can be set on a send.

This is often the balance minus the fees, but there are exceptions that depend between coins (reserve, burn, frozen part of the balance,...).

By "estimated", it means this is not necessarily correct and there might be a delta that is +- the actual reality (meaning trying to send with this amount can either exceed the spendable or leave some dust). It should not be used to do an actual SEND MAX (there is `useAllAmount` for this) but it can be used for an informative UI or also for "dry run" approaches (try a transaction with that, and refine).

The strategy of implementations should be to prefer pessimistic estimation rather than a potentially impossible transaction, in other words, an implementation should consider the worst-case scenario (like sending all UTXOs to a legacy address has higher fees resulting in a lower max spendable)

the parameters `account` and `parentAccount` are the regular account parameter for normal account and token accounts.

The parameter `transaction` allows refining the estimation to better precision. If provided, an implementation needs to be accurate and try to have an actual SEND MAX value. If the information on `transaction` is partial, it can still help the calculation but it's not guaranteed.

## Serialized usage

TO BE DOCUMENTED. usage in Ledger Live Desktop in context of serialization.

```js
type SignOperationEventRaw =
  | { type: "device-streaming", progress: number, index: number, total: number }
  | { type: "device-signature-requested" }
  | { type: "device-signature-granted" }
  | { type: "signed", signedOperation: SignedOperationRaw };

type TransactionCommonRaw = {|
  amount: string,
  recipient: string,
  useAllAmount?: boolean,
  subAccountId?: ?string,
|};

type SignedOperationRaw = {|
  operation: OperationRaw,
  signature: string,
  signatureRaw?: Object,
  expirationDate: ?string,
|};

type TransactionStatusRaw = {|
  errors: { [string]: string },
  warnings: { [string]: string },
  estimatedFees: string,
  amount: string,
  totalSpent: string,
  useAllAmount?: boolean,
  recipientIsReadOnly?: boolean,
|};
```

## React `useTransactionBridge` hook

TO BE DOCUMENTED.

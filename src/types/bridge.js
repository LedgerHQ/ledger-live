// @flow

// NB this new "bridge" is a re-take of live-desktop bridge ideas
// with a focus to eventually make it shared across both projects.

// a WalletBridge is implemented on renderer side.
// this is an abstraction on top of underlying blockchains api (libcore / ethereumjs / ripple js / ...)
// that would directly be called from UI needs.

import type { Observable } from "rxjs";
import type { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  CryptoCurrency,
  TransactionStatus,
  Transaction,
  SignAndBroadcastEvent,
  DerivationMode
} from ".";

export type ScanAccountEvent = {
  type: "discovered",
  account: Account
}; // more events will come in the future

export type ScanAccountEventRaw = {
  type: "discovered",
  account: AccountRaw
};

// unique identifier of a device. it will depends on the underlying implementation.
export type DeviceId = string;

// Abstraction related to a currency
export interface CurrencyBridge {
  scanAccountsOnDevice(
    currency: CryptoCurrency,
    deviceId: DeviceId,
    scheme?: ?DerivationMode
  ): Observable<ScanAccountEvent>;
}

export type Capabilities = {
  canSync: boolean,
  canSend: boolean
};

// Abstraction related to an account
export interface AccountBridge<T: Transaction> {
  // synchronizes an account continuously to update with latest blochchains state.
  // (NOT YET SUPPORTED) if used with observation=true, it will keep the Observable opened and emit to it new updates.
  // if used with observation=false, it stops at first sync and you will have to call it again.
  // The function emits updater functions each time there are data changes (e.g. blockchains updates)
  // an update function is just a Account => Account that perform the changes (to avoid race condition issues)
  // initialAccount parameter is used to point which account is the synchronization on, but it should not be used in the emitted values.
  // the sync can be stopped at any time using Observable's subscription.unsubscribe()
  startSync(
    initialAccount: Account,
    observation: boolean
  ): Observable<(Account) => Account>;

  // TODO we will remove it in favor of just feature detecting by doing createTransaction() for canSend.
  getCapabilities(account: Account): Capabilities;

  // a Transaction object is created on UI side as a black box to put all temporary information to build the transaction at the end.
  // There are a bunch of edit and get functions to edit and extract information out ot this black box.
  // it needs to be a serializable JS object
  createTransaction(account: Account): T;

  updateTransaction(t: T, patch: $Shape<T>): T;

  // prepare the remaining missing part of a transaction typically from network (e.g. fees)
  // and fulfill it in a new transaction object that is returned (async)
  prepareTransaction(account: Account, transaction: T): Promise<T>;

  // calculate / get derived state of the Transaction, useful to display summary / errors / warnings. tell if the transaction is ready.
  // ? MUST not fail even without network
  getTransactionStatus(
    account: Account,
    transaction: T
  ): Promise<TransactionStatus>;

  // finalizes the transaction by
  // - signing it with the ledger device
  // - broadcasting it to network
  // - retrieve and return the optimistic Operation that this transaction is likely to create in the future
  signAndBroadcast(
    account: Account,
    transaction: T,
    deviceId: DeviceId
  ): Observable<SignAndBroadcastEvent>;

  // some coins will have a way to configure the API it hits.
  // it is stored in account.endpointConfig
  // this allow to customize it from UI. there is a default endpoint and a way to validate a new one.
  // FIXME drop?
  getDefaultEndpointConfig?: () => string;
  validateEndpointConfig?: (endpointConfig: string) => Promise<void>;

  //////////////////////////////
  //~~~~~~~ DEPRECATED ~~~~~~~//
  //////////////////////////////

  // FIXME: the *TransactionNetworkInfo should be merged into prepareTransaction !

  // fetch various information asynchronously: typically fees.
  // ideally should be loaded before checking valid tranction / calculating total to spend / max amount / ..
  fetchTransactionNetworkInfo(account: Account): Promise<Object>;

  // apply network info that was previously fetched
  // you might want to store the networkInfo so they can recovered in getTransactionNetworkInfo
  applyTransactionNetworkInfo(
    account: Account,
    transaction: T,
    networkInfo: Object
  ): Transaction;

  // synchronously retrieve the transactionNetworkInfo from a Transaction
  // null/undefined means the data needs to be fetched and applied
  getTransactionNetworkInfo(account: Account, transaction: T): ?Object;

  // For doing token account transactions, everything remain the same except
  // you need to build Transaction with a contextual TokenAccount
  // otherwise, all reference to Account remains the mainAccount
  editTokenAccountId?: (
    account: Account,
    transaction: T,
    subAccountId: ?string
  ) => T;

  getTokenAccountId?: (account: Account, transaction: T) => ?string;

  editTransactionAmount(account: Account, transaction: T, amount: BigNumber): T;

  getTransactionAmount(account: Account, transaction: T): BigNumber;

  editTransactionRecipient(
    account: Account,
    transaction: T,
    recipient: string
  ): T;

  getTransactionRecipient(account: Account, transaction: T): string;

  // edit any extra parameter (e.g. ripple tagId)
  // nothing happen if field is not supported, undefined is returned if not supported.
  editTransactionExtra(
    account: Account,
    transaction: T,
    field: string,
    value: any
  ): T;

  // edit any extra parameter (e.g. ripple tagId)
  // undefined is returned if not supported.
  getTransactionExtra(account: Account, transaction: T, field: string): any;

  // checks if a recipient is valid and returns potential warnings
  // - if promise is successful with null, all is fine
  // - if promise is successful with an error object, it's a warning to display
  // - if promise is unsuccessful, it's an error
  // FIXME replace by getTransactionStatus
  checkValidRecipient(account: Account, recipient: string): Promise<?Error>;

  // Validates that the transaction is ready to be performed with all information provided and correct.
  // - if promise is successful with null, it means transaction can be performed
  // - if promise is successful with an error object, it's just a warning to display
  // - otherwise it throws an error with the reason of the invalid case.
  // FIXME replace by getTransactionStatus
  checkValidTransaction(account: Account, transaction: T): Promise<?Error>;

  // get the total amount that will be spend for a given transaction
  // FIXME replace by getTransactionStatus
  getTotalSpent(account: Account, transaction: T): Promise<BigNumber>;

  // max amount an account can be wiped. this is to be connected to the "MAX" feature
  // this can depends on fields of transaction itself because it depends on contextual information like if you send to a segwit/non-segwit address, etc..
  // FIXME replace by getTransactionStatus
  getMaxAmount(account: Account, transaction: T): Promise<BigNumber>;
}

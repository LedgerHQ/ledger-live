// @flow

// NB this new "bridge" is a re-take of live-desktop bridge ideas
// with a focus to eventually make it shared across both projects.

// a WalletBridge is implemented on renderer side.
// this is an abstraction on top of underlying blockchains api (libcore / ethereumjs / ripple js / ...)
// that would directly be called from UI needs.

import type { Observable } from "rxjs";
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
  // Preload data required for the bridges to work. (e.g. tokens, delegators,...)
  // Assume to call it at every load time but as lazy as possible (if user have such account already AND/OR if user is about to scanAccountsOnDevice)
  // returned value is a serializable object
  // fail if data was not able to load.
  preload(): Promise<Object>;

  // reinject the preloaded data (typically if it was cached)
  // method need to treat the data object as unsafe and validate all fields / be backward compatible.
  hydrate(data: mixed): void;

  // Scan all available accounts with a device
  scanAccountsOnDevice(
    currency: CryptoCurrency,
    deviceId: DeviceId,
    scheme?: ?DerivationMode
  ): Observable<ScanAccountEvent>;
}

export type Capabilities = {
  canDelegate: boolean,
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
}

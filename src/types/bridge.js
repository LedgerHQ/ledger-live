// @flow

// NB this new "bridge" is a re-take of live-desktop bridge ideas
// with a focus to eventually make it shared across both projects.

// a WalletBridge is implemented on renderer side.
// this is an abstraction on top of underlying blockchains api (libcore / ethereumjs / ripple js / ...)
// that would directly be called from UI needs.

import { BigNumber } from "bignumber.js";
import type { Observable } from "rxjs";
import type {
  AccountLike,
  Account,
  AccountRaw,
  CryptoCurrency,
  TransactionStatus,
  Transaction,
  SignOperationEvent,
  SignedOperation,
  Operation,
  DerivationMode,
  SyncConfig,
  CryptoCurrencyIds,
} from ".";

export type ScanAccountEvent = {
  type: "discovered",
  account: Account,
}; // more events will come in the future

export type ScanAccountEventRaw = {
  type: "discovered",
  account: AccountRaw,
};

// unique identifier of a device. it will depends on the underlying implementation.
export type DeviceId = string;

export type PreloadStrategy = $Shape<{
  preloadMaxAge: number,
}>;

// Abstraction related to a currency
export interface CurrencyBridge {
  // Preload data required for the bridges to work. (e.g. tokens, delegators,...)
  // Assume to call it at every load time but as lazy as possible (if user have such account already AND/OR if user is about to scanAccounts)
  // returned value is a serializable object
  // fail if data was not able to load.
  preload(currency: CryptoCurrency): Promise<Object>;

  // reinject the preloaded data (typically if it was cached)
  // method need to treat the data object as unsafe and validate all fields / be backward compatible.
  hydrate(data: mixed, currency: CryptoCurrency): void;

  // Scan all available accounts with a device
  scanAccounts({
    currency: CryptoCurrency,
    deviceId: DeviceId,
    scheme?: ?DerivationMode,
    syncConfig: SyncConfig,
    preferredNewAccountScheme?: DerivationMode,
  }): Observable<ScanAccountEvent>;

  getPreloadStrategy?: (currency: CryptoCurrency) => PreloadStrategy;
}

// Abstraction related to an account
export interface AccountBridge<T: Transaction> {
  // synchronizes an account continuously to update with latest blochchains state.
  // The function emits updater functions each time there are data changes (e.g. blockchains updates)
  // an update function is just a Account => Account that perform the changes (to avoid race condition issues)
  // initialAccount parameter is used to point which account is the synchronization on, but it should not be used in the emitted values.
  // the sync can be stopped at any time using Observable's subscription.unsubscribe()
  sync(
    initialAccount: Account,
    syncConfig: SyncConfig
  ): Observable<(Account) => Account>;

  receive(
    account: Account,
    {
      verify?: boolean,
      deviceId: string,
      subAccountId?: string,
      freshAddressIndex?: number,
    }
  ): Observable<{
    address: string,
    path: string,
  }>;

  // a Transaction object is created on UI side as a black box to put all temporary information to build the transaction at the end.
  // There are a bunch of edit and get functions to edit and extract information out ot this black box.
  // it needs to be a serializable JS object
  createTransaction(account: Account): T;

  updateTransaction(t: T, patch: $Shape<T>): T;

  // prepare the remaining missing part of a transaction typically from network (e.g. fees)
  // and fulfill it in a new transaction object that is returned (async)
  // It can fails if the the network is down.
  prepareTransaction(account: Account, transaction: T): Promise<T>;

  // calculate derived state of the Transaction, useful to display summary / errors / warnings. tells if the transaction is ready.
  getTransactionStatus(
    account: Account,
    transaction: T
  ): Promise<TransactionStatus>;

  // heuristic that provides the estimated max amount that can be set to a send.
  // this is usually the balance minus the fees, but it really depends between coins (reserve, burn, frozen part of the balance,...).
  // it is a heuristic in that this is not necessarily correct and it can be +-delta (so the info can exceed the spendable or leave some dust).
  // it's used as informative UI and also used for "dry run" approaches, but it shouldn't be used to determine the final SEND MAX amount.
  // it returns an amount in the account unit
  // if a transaction is provided, it can be used to precise the information
  // if it not provided, you can assume to take the worst-case scenario (like sending all UTXOs to a legacy address has higher fees resulting in a lower max spendable)
  estimateMaxSpendable({
    account: AccountLike,
    parentAccount?: ?Account,
    transaction?: ?T,
  }): Promise<BigNumber>;

  // finalizing a transaction by signing it with the ledger device
  // This results of a "signed" event with a signedOperation
  // than can be locally saved and later broadcasted
  signOperation({
    account: Account,
    transaction: T,
    deviceId: DeviceId,
  }): Observable<SignOperationEvent>;

  // broadcasting a signed transaction to network
  // returns an optimistic Operation that this transaction is likely to create in the future
  broadcast({
    account: Account,
    signedOperation: SignedOperation,
  }): Promise<Operation>;
}

type ExpectFn = Function;

export type CurrenciesData<T: Transaction> = {|
  FIXME_ignoreAccountFields?: string[],
  FIXME_ignoreOperationFields?: string[],
  scanAccounts?: Array<{|
    name: string,
    apdus: string,
    unstableAccounts?: boolean,
    test?: (
      expect: ExpectFn,
      scanned: Account[],
      bridge: CurrencyBridge
    ) => any,
  |}>,
  accounts?: Array<{|
    implementations?: string[],
    raw: AccountRaw,
    FIXME_tests?: Array<string | RegExp>,
    transactions?: Array<{|
      name: string,
      transaction: T | ((T, Account, AccountBridge<T>) => T),
      expectedStatus?:
        | $Shape<TransactionStatus>
        | ((Account, T, TransactionStatus) => $Shape<TransactionStatus>),
      test?: (ExpectFn, T, TransactionStatus, AccountBridge<T>) => any,
      apdus?: string,
      testSignedOperation?: (
        ExpectFn,
        SignedOperation,
        Account,
        T,
        TransactionStatus,
        AccountBridge<T>
      ) => any,
    |}>,
    test?: (ExpectFn, Account, AccountBridge<T>) => any,
  |}>,
  test?: (ExpectFn, CurrencyBridge) => any,
|};

export type DatasetTest<T> = {|
  implementations: string[],
  currencies: {
    [_: CryptoCurrencyIds]: CurrenciesData<T>,
  },
|};

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
  Operation,
  Currency,
} from "@ledgerhq/live-common/lib/types";

// unique identifier of a device. it will depends on the underlying implementation.
export type DeviceId = string;

export type SignAndBroadcastEvent =
  | { type: "signed" }
  | { type: "broadcasted", operation: Operation };

export interface WalletBridge<Transaction> {
  scanAccountsOnDevice(
    currency: Currency,
    deviceId: DeviceId,
  ): Observable<Account>;

  // synchronizes an account continuously to update with latest blochchains state.
  // if used with observation=true, it will keep the Observable opened and emit to it new updates.
  // if used with observation=false, it stops at first sync and you will have to call it again.
  // The function emits updater functions each time there are data changes (e.g. blockchains updates)
  // an update function is just a Account => Account that perform the changes (to avoid race condition issues)
  // initialAccount parameter is used to point which account is the synchronization on, but it should not be used in the emitted values.
  // the sync can be stopped at any time using Observable's subscription.unsubscribe()
  startSync(
    initialAccount: Account,
    observation: boolean,
  ): Observable<(Account) => Account>;

  // a Transaction object is created on UI side as a black box to put all temporary information to build the transaction at the end.
  // There are a bunch of edit and get functions to edit and extract information out ot this black box.
  // it needs to be a serializable JS object
  createTransaction(account: Account): Transaction;

  editTransactionAmount(
    account: Account,
    transaction: Transaction,
    amount: BigNumber,
  ): Transaction;

  getTransactionAmount(account: Account, transaction: Transaction): BigNumber;

  editTransactionRecipient(
    account: Account,
    transaction: Transaction,
    recipient: string,
  ): Transaction;

  getTransactionRecipient(account: Account, transaction: Transaction): string;

  // checks if a recipient is valid and returns potential warnings
  // - if promise is successful with null, all is fine
  // - if promise is successful with an error object, it's a warning to display
  // - if promise is unsuccessful, it's an error
  checkValidRecipient(currency: Currency, recipient: string): Promise<?Error>;

  // Validates that the transaction is ready to be performed with all information provided and correct.
  // - if promise is successful with null, it means transaction can be performed
  // - if promise is successful with an error object, it's just a warning to display
  // - otherwise it throws an error with the reason of the invalid case.
  checkValidTransaction(
    account: Account,
    transaction: Transaction,
  ): Promise<?Error>;

  // get the total amount that will be spend for a given transaction
  getTotalSpent(account: Account, transaction: Transaction): Promise<BigNumber>;

  // max amount an account can be wiped. this is to be connected to the "MAX" feature
  // this can depends on fields of transaction itself because it depends on contextual information like if you send to a segwit/non-segwit address, etc..
  getMaxAmount(account: Account, transaction: Transaction): Promise<BigNumber>;

  // finalizes the transaction by
  // - signing it with the ledger device
  // - broadcasting it to network
  // - retrieve and return the optimistic Operation that this transaction is likely to create in the future
  signAndBroadcast(
    account: Account,
    transaction: Transaction,
    deviceId: DeviceId,
  ): Observable<SignAndBroadcastEvent>;

  // Implement an optimistic response for signAndBroadcast.
  // it should add the operation in account.pendingOperations.
  // if you do implement this, make sure to properly handle cleanup of pendingOperations (likely to do during sync, for instance make sure to clean "zombies" transaction and transaction that actually appear in .operations)
  addPendingOperation?: (
    account: Account,
    optimisticOperation: Operation,
  ) => Account;

  // some coins will have a way to configure the API it hits.
  // it is stored in account.endpointConfig
  // this allow to customize it from UI. there is a default endpoint and a way to validate a new one.
  getDefaultEndpointConfig?: () => string;
  validateEndpointConfig?: (endpointConfig: string) => Promise<void>;
}

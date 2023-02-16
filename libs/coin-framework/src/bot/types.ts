import { BigNumber } from "bignumber.js";
import Transport from "@ledgerhq/hw-transport";
import type { DeviceModelId } from "@ledgerhq/devices";
import {
  Account,
  AccountBridge,
  AccountRaw,
  Operation,
  SignedOperation,
  SignOperationEvent,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

// Type coming from live-common/src/load/speculos.ts
export type AppCandidate = {
  path: string;
  model: DeviceModelId;
  firmware: string;
  appName: string;
  appVersion: string;
};
export type DeviceActionEvent = {
  text: string;
  x: number;
  y: number;
};
export type TransactionTestInput<T> = {
  account: Account;
  accountBeforeTransaction: Account;
  transaction: T;
  status: TransactionStatusCommon;
  optimisticOperation: Operation;
  operation: Operation;
};
export type TransactionDestinationTestInput<T> = {
  sendingAccount: Account;
  sendingOperation: Operation;
  destinationBeforeTransaction: Account;
  operation: Operation;
  destination: Account;
  transaction: T;
  status: TransactionStatusCommon;
};
export type DeviceActionArg<T extends TransactionCommon, S> = {
  appCandidate: AppCandidate;
  account: Account;
  transaction: T;
  status: TransactionStatusCommon;
  transport: Transport & {
    button: (arg0: string) => void;
  };
  event: DeviceActionEvent;
  state: S;
  disableStrictStepValueValidation?: boolean;
};
export type DeviceAction<T extends TransactionCommon, S> = (
  arg0: DeviceActionArg<T, S>
) => S | null | undefined;
export type TransactionArg<T extends TransactionCommon> = {
  appCandidate: AppCandidate;
  account: Account;
  siblings: Account[];
  bridge: AccountBridge<T>;
  maxSpendable: BigNumber;
  preloadedData: any;
};
export type TransactionRes<T extends TransactionCommon> = {
  transaction: T;
  updates: Array<Partial<T> | null | undefined>;
  destination?: Account;
};
export type MutationSpec<T extends TransactionCommon> = {
  // Name what this mutation is doing
  name: string;
  // The maximum number of times to execute this mutation for a given test run
  maxRun: number;
  // Express the transaction to be done
  // it returns either a transaction T, or an array with T and a list of patch to apply to it
  transaction: (arg: TransactionArg<T>) => TransactionRes<T>;
  // if there is a status errors/warnings of the defined transaction, this function, if define, can try to recover from it
  recoverBadTransactionStatus?: (arg0: {
    transaction: T;
    status: TransactionStatusCommon;
    account: Account;
    bridge: AccountBridge<T>;
  }) => T | null | undefined;
  // express what are the status warnings to express on a given transaction
  expectStatusWarnings?: (arg0: {
    transaction: T;
    status: TransactionStatusCommon;
    account: Account;
    bridge: AccountBridge<T>;
  }) => { [_: string]: Error } | undefined;
  // Express the device actions to do (buttons,..) and validate the device screen. overrides genericDeviceAction
  deviceAction?: DeviceAction<T, any>;
  // how much time to wait in maximum to reach the final state
  testTimeout?: number;
  // Implement a test that runs after the operation is applied to the account
  test?: (input: TransactionTestInput<T>) => void;
  // Implement a second test that allows to test the effect of the transaction on the DESTINATION account (matched by recipient)
  testDestination?: (input: TransactionDestinationTestInput<T>) => void;
};

export type AppSpec<T extends TransactionCommon> = {
  // allows to disable completely spec from running
  disabled?: boolean;
  // an arbitrary name to identify the bot spec
  name: string;
  // which crypto currency will the bot scan accounts with
  currency: CryptoCurrency;
  // how much time in ms does the test need to wait the operation to appear
  testTimeout?: number;
  // how much should we retry scan accounts if an error occurs
  scanAccountsRetries?: number;
  // if define, will run the mutations {multipleRuns} times in order to cover 2 txs in the same run and detect possible issues at the "second tx time"
  multipleRuns?: number;
  // define the frequency of exporting/importing back the account to simulate mobile export
  crossAccountFrequency?: number;
  // if the nano app depends on an app, name of this app
  dependency?: string;
  // a query to select one nano app. the most up to date version is selected when fields aren't set.
  appQuery: {
    model?: DeviceModelId;
    appName?: string;
    firmware?: string;
    appVersion?: string;
  };
  // all the possible scenarios of these spec to consider doing transactions with
  mutations: MutationSpec<T>[];
  // can implement generic invariants for a mutation transaction to be possible
  transactionCheck?: (arg: TransactionArg<T>) => void;
  // Implement a test that also runs on each mutation after the operation is applied to the account
  // this allows to verify the effect of the transaction is correctly applied on the account
  test?: (arg0: TransactionTestInput<T>) => void;
  // Express the device actions to do (buttons,..) and validate the device screen
  genericDeviceAction: DeviceAction<T, any>;
  // typically for 'botTransfer' we need to be able to override the preferred way to transfer a sub account
  genericDeviceActionForSubAccountTransfers?: DeviceAction<T, any>;
  // indicates to the engine what's the generally minimal amount we use to opt out from doing a transaction
  // NB: at the moment it's purely informative and help inferring good "hints", but we could eventually automate it
  minViableAmount?: BigNumber;
  // global timeout to consider the run due date for the spec. (since a seed could have theorically an infinite amount of accounts and mutation could take a lot of time to validate transactions, we need a way to limit the run time)
  skipMutationsTimeout?: number;
  // do not expect an account to always be found (Hedera case)
  allowEmptyAccounts?: boolean;
};
export type SpecReport<T extends TransactionCommon> = {
  spec: AppSpec<T>;
  appPath?: string;
  scanDuration?: number;
  preloadDuration?: number;
  accountsBefore?: Account[];
  accountsAfter?: Account[];
  mutations?: MutationReport<T>[];
  fatalError?: Error;
  // express hints for the spec developers on things that could be improved
  hintWarnings: string[];
  skipMutationsTimeoutReached: boolean;
};
export type MutationReport<T extends TransactionCommon> = {
  resyncAccountsDuration: number;
  spec: AppSpec<T>;
  appCandidate: AppCandidate;
  account?: Account;
  maxSpendable?: BigNumber;
  unavailableMutationReasons?: Array<{
    error: Error;
    mutation: MutationSpec<T>;
  }>;
  mutation?: MutationSpec<T>;
  mutationTime?: number;
  destination?: Account;
  transaction?: T;
  status?: TransactionStatusCommon;
  statusTime?: number;
  recoveredFromTransactionStatus?: {
    transaction: T;
    status: TransactionStatusCommon;
  };
  latestSignOperationEvent?: SignOperationEvent;
  signedOperation?: SignedOperation;
  signedTime?: number;
  optimisticOperation?: Operation;
  broadcastedTime?: number;
  operation?: Operation;
  confirmedTime?: number;
  finalAccount?: Account;
  testDuration?: number;
  destinationConfirmedTime?: number;
  finalDestination?: Account;
  finalDestinationOperation?: Operation;
  testDestinationDuration?: number;
  error?: Error;
  errorTime?: number;
  hintWarnings: string[];
};

export type MinimalSerializedMutationReport = {
  appCandidate: AppCandidate;
  mutationName: string | undefined;
  accountId: string | undefined;
  destinationId: string | undefined;
  operationId: string | undefined;
  error: string | undefined;
};

export type MinimalSerializedSpecReport = {
  // spec.name
  specName: string;
  // minified version of accounts (we remove transactions from them)
  accounts: AccountRaw[] | undefined;
  fatalError: string | undefined;
  mutations: MinimalSerializedMutationReport[] | undefined;
  existingMutationNames: string[];
  hintWarnings: string[];
};

export type MinimalSerializedReport = {
  results: Array<MinimalSerializedSpecReport>;
  environment: string | undefined;
  seedHash: string;
};

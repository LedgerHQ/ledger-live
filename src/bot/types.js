// @flow
import { BigNumber } from "bignumber.js";
import type Transport from "@ledgerhq/hw-transport";
import type {
  Account,
  AccountBridge,
  Transaction,
  TransactionStatus,
  SignedOperation,
  Operation,
  CryptoCurrency,
  SignOperationEvent,
} from "../types";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { AppCandidate } from "../load/speculos";

export type { AppCandidate };

type DeviceActionEvent = { text: string, x: number, y: number };

export type DeviceActionArg<T, S> = {
  appCandidate: AppCandidate,
  transaction: T,
  transport: Transport<*> & { button: (string) => void },
  event: DeviceActionEvent,
  state: S,
};

export type DeviceAction<T, S> = (DeviceActionArg<T, S>) => ?S;

export type MutationSpec<T: Transaction> = {
  // Name what this mutation is doing
  name: string,
  // The maximum number of times to execute this mutation for a given test run
  maxRun?: number,
  // Express the transaction to be done
  transaction: ({
    appCandidate: AppCandidate,
    account: Account,
    siblings: Account[],
    bridge: AccountBridge<T>,
    maxSpendable: BigNumber,
  }) => ?T,
  // Express the device actions to do (buttons,..) and validate the device screen
  deviceAction?: DeviceAction<T, any>,
  // Implement a test that runs after the operation is applied to the account
  test?: ({
    account: Account,
    accountBeforeTransaction: Account,
    transaction: T,
    status: TransactionStatus,
    optimisticOperation: Operation,
    operation: Operation,
  }) => void,
};

export type AppSpec<T: Transaction> = {
  name: string,
  currency: CryptoCurrency,
  dependency?: string,
  appQuery: {
    model?: DeviceModelId,
    appName?: string,
    firmware?: string,
    appVersion?: string,
  },
  mutations: MutationSpec<T>[],
};

export type MutationReport<T: Transaction> = {
  syncAllAccountsTime: number,
  spec: AppSpec<T>,
  appCandidate: AppCandidate,
  account?: Account,
  maxSpendable?: BigNumber,
  unavailableMutationReasons?: string[],
  mutation?: MutationSpec<T>,
  destination?: Account,
  transaction?: T,
  transactionTime?: number,
  status?: TransactionStatus,
  statusTime?: number,
  latestSignOperationEvent?: SignOperationEvent,
  signedOperation?: SignedOperation,
  signedTime?: number,
  optimisticOperation?: Operation,
  broadcastedTime?: number,
  operation?: Operation,
  confirmedTime?: number,
  finalAccount?: Account,
  error?: Error,
};

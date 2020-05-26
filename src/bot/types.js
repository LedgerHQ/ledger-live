// @flow
import type Transport from "@ledgerhq/hw-transport";
import type {
  Account,
  AccountBridge,
  Transaction,
  TransactionStatus,
  SignedOperation,
  Operation,
  CryptoCurrency,
} from "../types";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { AppCandidate } from "../load/speculos";

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
  name: string,
  transaction: ({
    appCandidate: AppCandidate,
    account: Account,
    siblings: Account[],
    bridge: AccountBridge<T>,
  }) => ?T,
  deviceAction?: DeviceAction<T, any>,
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
  spec: AppSpec<T>,
  appCandidate: AppCandidate,
  account?: Account,
  unavailableMutationReasons?: string[],
  mutation?: MutationSpec<T>,
  destination?: Account,
  transaction?: T,
  transactionTime?: number,
  status?: TransactionStatus,
  statusTime?: number,
  signedOperation?: SignedOperation,
  signedTime?: number,
  optimisticOperation?: Operation,
  broadcastedTime?: number,
  operation?: Operation,
  confirmedTime?: number,
  finalAccount?: Account,
  error?: Error,
};

import { Observable } from "rxjs";
import BigNumber from "bignumber.js";
import type { AccountLike, OperationType, SignOperationEvent } from "@ledgerhq/types-live";
import { ALEO_ACCOUNT_1 } from "./account.mock";

export type MockTransactionStatus = {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  estimatedFees: BigNumber;
  amount: BigNumber;
  totalSpent: BigNumber;
};

export const DEFAULT_TRANSACTION_STATUS: MockTransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(1000),
  amount: new BigNumber(1_000_000),
  totalSpent: new BigNumber(1_001_000),
};

const DEFAULT_TRANSACTION = {
  family: "aleo" as const,
  mode: "transfer_public",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  subAccountId: undefined,
};

// jest.mock factories are hoisted above the imports, so the bridge cannot be built per test.
let transaction: object = DEFAULT_TRANSACTION;
let operationType: OperationType = "OUT";
let status: MockTransactionStatus = DEFAULT_TRANSACTION_STATUS;

const signedOperation = () => ({
  signature: "sig",
  operation: {
    id: "op-1",
    hash: "0xabc",
    type: operationType,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: ALEO_ACCOUNT_1.id,
    date: new Date(),
    extra: {},
  },
});

export const aleoAccountBridge = {
  createTransaction: jest.fn((_account: AccountLike) => transaction),
  updateTransaction: jest.fn((tx: object, patch: object) => ({
    ...tx,
    ...patch,
  })),
  prepareTransaction: async (_account: AccountLike, tx: unknown) => tx,
  getTransactionStatus: jest.fn(async () => status),
  estimateMaxSpendable: async () => new BigNumber(100_000_000),
  getStuckAccountAndOperation: () => null,
  isAccountEmpty: () => false,
  signOperation: jest.fn(
    () =>
      new Observable<SignOperationEvent>(subscriber => {
        subscriber.next({ type: "device-signature-requested" });
        subscriber.next({ type: "device-signature-granted" });
        subscriber.next({
          type: "signed",
          signedOperation: signedOperation() as never,
        });
        subscriber.complete();
      }),
  ),
  broadcast: async ({ signedOperation: signed }: { signedOperation: { operation: unknown } }) =>
    signed.operation,
};

const currencyBridge = {
  preload: () => Promise.resolve(true),
  hydrate: () => true,
};

/** Both bridges are awaited in some call sites and read synchronously in others. */
const resolved = <T>(value: T) =>
  Object.assign(Promise.resolve(value), {
    status: "fulfilled" as const,
    value,
  });

export const aleoBridgeModule = {
  __esModule: true,
  getAccountBridge: () => resolved(aleoAccountBridge),
  getCurrencyBridge: () => resolved(currencyBridge),
};

export function resetAleoBridgeMock(
  options: { transaction?: object; operationType?: OperationType } = {},
) {
  transaction = options.transaction ?? DEFAULT_TRANSACTION;
  operationType = options.operationType ?? "OUT";
  status = DEFAULT_TRANSACTION_STATUS;
  aleoAccountBridge.createTransaction.mockClear();
  aleoAccountBridge.updateTransaction.mockClear();
  aleoAccountBridge.signOperation.mockClear();
  aleoAccountBridge.getTransactionStatus.mockClear();
}

/** Overrides the default status for every subsequent `getTransactionStatus`. */
export function mockTransactionStatus(overrides: Partial<MockTransactionStatus>) {
  status = { ...DEFAULT_TRANSACTION_STATUS, ...overrides };
}

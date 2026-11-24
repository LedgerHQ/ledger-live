import { Observable } from "rxjs";
import BigNumber from "bignumber.js";
import type { AccountLike, SignOperationEvent } from "@ledgerhq/types-live";
import type { TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { XRP_ACCOUNT } from "./account.mock";

type MockAccountBridge = ReturnType<typeof makeMockAccountBridge>;

const mockSignedOperation = {
  signature: "sig",
  operation: {
    id: "op-1",
    hash: "0xabc",
    type: "OPT_IN",
    value: new BigNumber(0),
    fee: new BigNumber(12),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: XRP_ACCOUNT.id,
    date: new Date(),
    extra: {},
  },
  expirationDate: undefined,
};

function makeTransactionStatus(
  errors: Record<string, Error> = {},
  warnings: Record<string, Error> = {},
): TransactionStatus {
  const estimatedFees = new BigNumber(12);

  return {
    errors,
    warnings,
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent: estimatedFees,
  };
}

export function makeMockAccountBridge() {
  return {
    createTransaction: jest.fn((_account: AccountLike) => ({
      family: "xrp" as const,
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
      networkInfo: null,
      tag: null,
    })),
    updateTransaction: jest.fn((tx: object, patch: object) => ({ ...tx, ...patch })),
    prepareTransaction: async (_account: AccountLike, tx: unknown) => tx,
    getTransactionStatus: jest.fn(
      async (_account: AccountLike, _transaction: { amount: BigNumber }) => {
        return makeTransactionStatus();
      },
    ),
    estimateMaxSpendable: async () => new BigNumber(100_000_000),
    getStuckAccountAndOperation: () => null,
    signOperation: jest.fn(
      () =>
        new Observable<SignOperationEvent>(subscriber => {
          subscriber.next({ type: "device-signature-requested" });
          subscriber.next({ type: "device-signature-granted" });
          subscriber.next({ type: "signed", signedOperation: mockSignedOperation as never });
          subscriber.complete();
        }),
    ),
    broadcast: jest.fn(
      async ({ signedOperation }: { signedOperation: typeof mockSignedOperation }) => {
        return signedOperation.operation;
      },
    ),
  };
}

export function makeNamedError(name: string, fields: Record<string, string> = {}) {
  return Object.assign(new Error(name), { name, ...fields });
}

export function mockTransactionStatus(
  accountBridge: { getTransactionStatus: jest.Mock<Promise<TransactionStatus>> },
  errors: Record<string, Error>,
  warnings: Record<string, Error> = {},
) {
  accountBridge.getTransactionStatus.mockResolvedValue(makeTransactionStatus(errors, warnings));
}

const currencyBridge = { preload: () => Promise.resolve(true), hydrate: () => true };

export const resolvedCurrencyBridge = Object.assign(Promise.resolve(currencyBridge), {
  status: "fulfilled" as const,
  value: currencyBridge,
});

export function mockStatus(
  accountBridge: MockAccountBridge,
  errors: Record<string, Error>,
  warnings: Record<string, Error> = {},
) {
  accountBridge.getTransactionStatus.mockResolvedValue({
    errors,
    warnings,
    estimatedFees: new BigNumber(12),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(12),
  });
}

export function makeResolvedAccountBridge(accountBridge: MockAccountBridge) {
  return Object.assign(Promise.resolve(accountBridge), {
    status: "fulfilled" as const,
    value: accountBridge,
  });
}

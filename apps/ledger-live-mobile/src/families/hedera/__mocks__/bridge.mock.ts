import { Observable } from "rxjs";
import BigNumber from "bignumber.js";
import type { AccountLike, SignOperationEvent } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/hedera/types";
import { HEDERA_ACCOUNT_1 } from "./account.mock";

export const mockSignedOperation = {
  signature: "sig",
  operation: {
    id: "op-1",
    hash: "0xabc",
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: HEDERA_ACCOUNT_1.id,
    date: new Date(),
    extra: {},
  },
  expirationDate: undefined,
};

export function makeMockAccountBridge(
  mode: Transaction["mode"],
  properties?: Record<string, unknown>,
) {
  return {
    createTransaction: jest.fn((_account: AccountLike) => ({
      family: "hedera" as const,
      mode,
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      ...(properties !== undefined ? { properties } : {}),
    })),
    updateTransaction: jest.fn((tx: object, patch: object) => ({ ...tx, ...patch })),
    prepareTransaction: async (_account: AccountLike, tx: unknown) => tx,
    getTransactionStatus: async () => ({
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(1000),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(1000),
    }),
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
    broadcast: async ({ signedOperation }: { signedOperation: typeof mockSignedOperation }) =>
      signedOperation.operation,
  };
}

const currencyBridge = { preload: () => Promise.resolve(true), hydrate: () => true };

export const resolvedCurrencyBridge = Object.assign(Promise.resolve(currencyBridge), {
  status: "fulfilled" as const,
  value: currencyBridge,
});

export function makeResolvedAccountBridge(accountBridge: ReturnType<typeof makeMockAccountBridge>) {
  return Object.assign(Promise.resolve(accountBridge), {
    status: "fulfilled" as const,
    value: accountBridge,
  });
}

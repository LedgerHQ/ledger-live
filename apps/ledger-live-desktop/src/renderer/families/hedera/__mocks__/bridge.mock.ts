import BigNumber from "bignumber.js";
import { ReplaySubject, Subject } from "rxjs";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import type { HederaGenericTransaction } from "@ledgerhq/live-common/families/hedera/types";
import { makeHederaTransaction } from "./transaction.mock";
import { mockBroadcastedOperation } from "./signedOperation.mock";

// Mutable refs — bridge methods close over these at call time so that
// reinitialising subjects in beforeEach is transparently picked up.
export const subjectRefs = {} as {
  sync: Subject<(acc: Account) => Account>;
  sign: ReplaySubject<SignOperationEvent>;
};

export function initSendSubjects(): void {
  subjectRefs.sync = new Subject();
  subjectRefs.sign = new ReplaySubject(1);
}

export const mockDevice = { modelId: "stax", deviceId: "test-device-id", wired: false } as const;
export const mockAppState = { device: mockDevice, opened: true, isLocked: false };

export const mockAccountBridge = {
  createTransaction: (): HederaGenericTransaction => makeHederaTransaction(),
  updateTransaction: (
    tx: HederaGenericTransaction,
    patch: Partial<HederaGenericTransaction>,
  ): HederaGenericTransaction => ({ ...tx, ...patch }),
  prepareTransaction: jest.fn(
    async (_account: unknown, transaction: HederaGenericTransaction) => transaction,
  ),
  getTransactionStatus: jest.fn(async () => ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(100_000),
    amount: new BigNumber(1_000_000),
    totalSpent: new BigNumber(1_100_000),
  })),
  sync: () => subjectRefs.sync.asObservable(),
  signOperation: jest.fn((_args: { transaction: HederaGenericTransaction }) =>
    subjectRefs.sign.asObservable(),
  ),
  broadcast: async () => mockBroadcastedOperation,
  estimateMaxSpendable: async () => new BigNumber(100_000_000),
  // Hedera has no stuck-transaction (RBF) concept; mirror defaultBridgeExtensions behaviour.
  getStuckAccountAndOperation: () => undefined,
};

// Convenience aliases for tests that want to assert on or override these.
export const prepareTransactionSpy = mockAccountBridge.prepareTransaction;
export const getTransactionStatusSpy = mockAccountBridge.getTransactionStatus;
export const signOperationSpy = mockAccountBridge.signOperation;

// React's use() fast-path reads .status/.value directly off an already-tracked thenable,
// which is what Body.tsx's useAccountBridge() relies on (see bridge/useAccountBridge.ts).
export const resolvedAccountBridge = Object.assign(Promise.resolve(mockAccountBridge), {
  status: "fulfilled" as const,
  value: mockAccountBridge,
});

const mockCurrencyBridge = {
  preload: () => Promise.resolve(true),
  hydrate: () => true,
};

export const resolvedCurrencyBridge = Object.assign(Promise.resolve(mockCurrencyBridge), {
  status: "fulfilled" as const,
  value: mockCurrencyBridge,
});

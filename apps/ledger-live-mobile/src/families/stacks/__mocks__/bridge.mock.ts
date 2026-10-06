import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stacks/types";

export const DEFAULT_STATUS: TransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(180),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
};

export const mockBridge = {
  createTransaction: (): Transaction =>
    ({
      family: "stacks",
      amount: new BigNumber(0),
      recipient: "",
      network: "mainnet",
      anchorMode: 3,
      fee: new BigNumber(180),
    }) as Transaction,
  updateTransaction: (tx: Transaction, patch: Partial<Transaction>): Transaction => ({
    ...tx,
    ...patch,
  }),
};

type BridgeState = {
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
};

// jest.mock factories are hoisted above the imports, so tests tweak the bridge through this.
export const bridgeState: BridgeState = {
  status: DEFAULT_STATUS,
  bridgePending: false,
  bridgeError: null,
};

export const resetBridgeState = () => {
  bridgeState.status = DEFAULT_STATUS;
  bridgeState.bridgePending = false;
  bridgeState.bridgeError = null;
};

/** Keeps the transaction in real React state so screen updates (startBurnHt, amount) re-render. */
export function useFakeBridgeTransaction(
  _bridge: unknown,
  init: () => { transaction: Transaction },
) {
  const [transaction, setTransaction] = useState<Transaction>(() => init().transaction);
  const updateTransaction = useCallback(
    (updater: (tx: Transaction) => Transaction) => setTransaction(prev => updater(prev)),
    [],
  );
  // Stable per transaction, like the real hook's status state (screens compare it by reference).
  const baseStatus = bridgeState.status;
  const status: TransactionStatus = useMemo(
    () => ({
      ...baseStatus,
      amount: baseStatus.amount.gt(0) ? baseStatus.amount : transaction.amount,
    }),
    [baseStatus, transaction],
  );
  return {
    transaction,
    setTransaction,
    updateTransaction,
    status,
    bridgePending: bridgeState.bridgePending,
    bridgeError: bridgeState.bridgeError,
  };
}

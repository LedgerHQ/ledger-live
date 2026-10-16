// TODO: to remove once live-app-sdk is depreciated and removed from LL

import type { BitcoinTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import type { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided = (tx: PlatformTransaction): boolean => !!tx.feePerByte;

/** The platform transaction's top-level fee rate moves to `familySpecificData` (ADR-065 D15). */
const convertToLiveTransaction = (tx: PlatformTransaction): Partial<Transaction> => {
  const liveTx: Partial<Transaction> = {
    family: "bitcoin",
    amount: tx.amount,
    recipient: tx.recipient,
    ...(tx.feePerByte ? { familySpecificData: { feePerByte: tx.feePerByte.toFixed() } } : {}),
  };
  return areFeesProvided(tx) ? { ...liveTx, feesStrategy: null } : liveTx;
};

const getPlatformTransactionSignFlowInfos = (
  tx: PlatformTransaction,
): {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<Transaction>;
} => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(tx),
    hasFeesProvided: areFeesProvided(tx),
  };
};

export default { getPlatformTransactionSignFlowInfos };

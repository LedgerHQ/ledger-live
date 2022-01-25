import { BitcoinTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided = (tx: PlatformTransaction): boolean => !!tx.feePerByte;

const convertToLiveTransaction = (
  tx: PlatformTransaction
): Partial<Transaction> => {
  const hasFeesProvided = areFeesProvided(tx);

  const liveTx: Partial<Transaction> = {
    ...tx,
    amount: tx.amount,
    recipient: tx.recipient,
    feePerByte: tx.feePerByte,
  };

  return hasFeesProvided ? { ...liveTx, feesStrategy: null } : liveTx;
};

const getPlatformTransactionSignFlowInfos = (
  tx: PlatformTransaction
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

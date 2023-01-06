import { BitcoinTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided = (tx: WalletAPITransaction): boolean => !!tx.feePerByte;

const convertToLiveTransaction = (
  tx: WalletAPITransaction
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

const getWalletAPITransactionSignFlowInfos = (
  tx: WalletAPITransaction
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

export default { getWalletAPITransactionSignFlowInfos };

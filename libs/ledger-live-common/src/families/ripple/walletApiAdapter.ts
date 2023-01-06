import { RippleTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided = (tx: WalletAPITransaction): boolean => !!tx.fee;

const convertToLiveTransaction = (
  tx: WalletAPITransaction
): Partial<Transaction> => {
  return tx;
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

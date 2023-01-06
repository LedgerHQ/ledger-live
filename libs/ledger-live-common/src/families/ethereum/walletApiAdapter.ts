import { EthereumTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided = (tx: WalletAPITransaction): boolean =>
  !!(tx.gasLimit || tx.gasPrice);

const convertToLiveTransaction = (
  tx: WalletAPITransaction
): Partial<Transaction> => {
  const hasFeesProvided = areFeesProvided(tx);

  const { gasLimit, ...restTx } = tx;

  const liveTx: Partial<Transaction> = {
    ...restTx,
    amount: tx.amount,
    recipient: tx.recipient,
    gasPrice: tx.gasPrice,
    userGasLimit: gasLimit,
  };

  return hasFeesProvided ? { ...liveTx, feesStrategy: "custom" } : liveTx;
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

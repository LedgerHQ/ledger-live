// TODO: to remove once live-app-sdk is depreciated and removed from LL

import { EthereumTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided = (tx: PlatformTransaction): boolean =>
  !!(tx.gasLimit || tx.gasPrice);

const convertToLiveTransaction = (
  tx: PlatformTransaction
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

// TODO: to remove once live-app-sdk is depreciated and removed from LL

import { EthereumTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import { Transaction } from "@ledgerhq/coin-evm/types/index";

const CAN_EDIT_FEES = true;

const areFeesProvided = (tx: PlatformTransaction): boolean => !!(tx.gasLimit || tx.gasPrice);

const convertToLiveTransaction = (tx: PlatformTransaction): Partial<Transaction> => {
  const hasFeesProvided = areFeesProvided(tx);

  const liveTx: Partial<Transaction> = {
    ...tx,
    family: "evm" as const,
    nonce: tx.nonce,
    amount: tx.amount,
    recipient: tx.recipient,
    data: tx.data,
    gasLimit: tx.gasLimit,
    feesStrategy: hasFeesProvided ? ("custom" as const) : undefined,
    customGasLimit: hasFeesProvided ? tx.gasLimit : undefined,
    // live-app-sdk does not handle type 2 for ethereum transactions
    // cf. `EthereumTransaction` type (`PlatformTransaction`), does not have
    // `maxPriorityFeePerGas` or `maxFeePerGas` properties
    type: 0,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  };

  return liveTx;
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

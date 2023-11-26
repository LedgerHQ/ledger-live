// TODO: to remove once live-app-sdk is depreciated and removed from LL

import { DEFAULT_NONCE } from "@ledgerhq/coin-evm/createTransaction";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import { EthereumTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";

const CAN_EDIT_FEES = true;

const areFeesProvided = (tx: PlatformTransaction): boolean => !!(tx.gasLimit && tx.gasPrice);

const convertToLiveTransaction = (tx: PlatformTransaction): Partial<Transaction> => {
  const hasFeesProvided = areFeesProvided(tx);

  const params = {
    family: "evm" as const,
    nonce: tx.nonce === undefined ? DEFAULT_NONCE : tx.nonce,
    amount: tx.amount,
    recipient: tx.recipient,
    data: tx.data,
    gasLimit: tx.gasLimit,
    customGasLimit: tx.gasLimit,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  };

  // We create a type 2 tx by default, and fallback to type 0 if gasPrice is provided
  const liveTx: Partial<Transaction> = tx.gasPrice
    ? {
        ...params,
        // custom feesStrategy is only available for type 0 tx since PlatformTransaction
        // does not have `maxPriorityFeePerGas` or `maxFeePerGas` properties
        feesStrategy: hasFeesProvided ? ("custom" as const) : undefined,
        gasPrice: tx.gasPrice,
        type: 0,
      }
    : { ...params, type: 2 };

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

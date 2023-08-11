import { EthereumTransaction as WalletAPIEthereumTransaction } from "@ledgerhq/wallet-api-core";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIEthereumTransaction> = tx =>
  !!((tx.gasLimit && tx.gasPrice) || (tx.gasLimit && tx.maxFeePerGas && tx.maxPriorityFeePerGas));

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIEthereumTransaction,
  Transaction
> = tx => {
  const hasFeesProvided = areFeesProvided(tx);

  const params = {
    family: "evm" as const,
    nonce: tx.nonce,
    amount: tx.amount,
    recipient: tx.recipient,
    data: tx.data,
    gasLimit: tx.gasLimit,
    feesStrategy: hasFeesProvided ? ("custom" as const) : ("medium" as const),
    customGasLimit: tx.gasLimit,
  };

  // We create a type 2 tx by default, and fallback to type 0 if gasPrice is provided
  const liveTx: Partial<Transaction> = tx.gasPrice
    ? {
        ...params,
        gasPrice: tx.gasPrice,
        type: 0,
      }
    : {
        ...params,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        type: 2,
      };

  return liveTx;
};

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIEthereumTransaction,
  Transaction
> = tx => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(tx),
    hasFeesProvided: areFeesProvided(tx),
  };
};

export default { getWalletAPITransactionSignFlowInfos };

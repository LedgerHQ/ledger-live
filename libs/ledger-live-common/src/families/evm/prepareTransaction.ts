import BigNumber from "bignumber.js";
import { getFeesEstimation, getGasEstimation } from "../../api/Evm";
import {
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  Transaction as EvmTransaction,
} from "./types";
import { Account } from "@ledgerhq/types-live";

export const prepareTransaction = async (
  account: Account,
  tx: EvmTransaction
): Promise<EvmTransaction> => {
  const { currency } = account;
  const gasLimit = await getGasEstimation(currency, tx);
  const feeData = await getFeesEstimation(currency);

  // If the blockchain is supporting EIP-1559, use maxFeePerGas & maxPriorityFeePerGas
  if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
    delete tx.gasPrice;
    return {
      ...tx,
      chainId: currency?.ethereumLikeInfo?.chainId || 0,
      gasLimit,
      maxFeePerGas: feeData.maxFeePerGas || undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
      type: new BigNumber(2),
    } as EvmTransactionEIP1559;
  }

  // Else just use a legacy transaction
  delete tx.maxFeePerGas;
  delete tx.maxPriorityFeePerGas;
  return {
    ...tx,
    chainId: currency?.ethereumLikeInfo?.chainId || 0,
    gasLimit,
    gasPrice: feeData.gasPrice || new BigNumber(0),
    type: new BigNumber(0),
  } as EvmTransactionLegacy;
};

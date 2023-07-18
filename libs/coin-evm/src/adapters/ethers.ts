import { ethers } from "ethers";
import { Transaction as EvmTransaction } from "../types";
import { getGasLimit } from "../logic";

/**
 * Adapter to convert a Ledger Live transaction to an Ethers transaction
 */
export const transactionToEthersTransaction = (tx: EvmTransaction): ethers.Transaction => {
  const gasLimit = getGasLimit(tx);

  const ethersTx = {
    to: tx.recipient,
    value: ethers.BigNumber.from(tx.amount.toFixed()),
    data: tx.data ? `0x${tx.data.toString("hex")}` : undefined,
    gasLimit: ethers.BigNumber.from(gasLimit.toFixed()),
    nonce: tx.nonce,
    chainId: tx.chainId,
    type: tx.type,
  } as Partial<ethers.Transaction>;

  // is EIP-1559 transaction (type 2)
  if (tx.type === 2) {
    ethersTx.maxFeePerGas = ethers.BigNumber.from(tx.maxFeePerGas.toFixed());
    ethersTx.maxPriorityFeePerGas = ethers.BigNumber.from(tx.maxPriorityFeePerGas.toFixed());
  } else {
    // is Legacy transaction (type 0)
    ethersTx.gasPrice = ethers.BigNumber.from(tx.gasPrice.toFixed());
  }

  return ethersTx as ethers.Transaction;
};

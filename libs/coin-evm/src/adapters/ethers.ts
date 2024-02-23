import { ethers } from "ethers";
import { Transaction as EvmTransaction } from "../types";
import { getGasLimit } from "../logic";
import { DEFAULT_NONCE } from "../createTransaction";

/**
 * Adapter to convert a Ledger Live transaction to an Ethers transaction
 */
export const transactionToEthersTransaction = (tx: EvmTransaction): ethers.Transaction => {
  const gasLimit = getGasLimit(tx);

  /**
   * removing floating point when rounding BigNumber (using 0 as argument to toFixed)
   * to avoid errors with ethers.BigNumber.from that does not handle floating point
   * since it is using BigNumber v5.7.0 (see https://www.npmjs.com/package/@ethersproject/bignumber)
   */

  const ethersTx = {
    to: tx.recipient,
    value: ethers.BigNumber.from(tx.amount.toFixed(0)),
    data: tx.data ? `0x${tx.data.toString("hex")}` : undefined,
    gasLimit: ethers.BigNumber.from(gasLimit.toFixed(0)),
    // When using DEFAULT_NONCE (-1) ethers might break on some methods,
    // therefore we replace this by an unrealisticly high nonce
    // to prevent any valid signature being crafted here
    nonce: tx.nonce === DEFAULT_NONCE ? Number.MAX_SAFE_INTEGER - 1 : tx.nonce,
    chainId: tx.chainId,
    type: tx.type,
  } as Partial<ethers.Transaction>;

  // is EIP-1559 transaction (type 2)
  if (tx.type === 2) {
    ethersTx.maxFeePerGas = ethers.BigNumber.from(tx.maxFeePerGas.toFixed(0));
    ethersTx.maxPriorityFeePerGas = ethers.BigNumber.from(tx.maxPriorityFeePerGas.toFixed(0));
  } else {
    // is Legacy transaction (type 0)
    ethersTx.gasPrice = ethers.BigNumber.from(tx.gasPrice.toFixed(0));
  }

  return ethersTx as ethers.Transaction;
};

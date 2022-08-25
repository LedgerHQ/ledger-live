/** ⚠️ keep this order of import. @see https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative ⚠️ */
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { transactionToEthersTransaction } from "../adapters";
import { Transaction as EvmTransaction } from "../types";
import { Account } from "@ledgerhq/types-live";

export const DEFAULT_RETRIES_RPC_METHODS = 2;

/**
 * Connects to RPC Node
 */
export async function withApi<T>(
  currency: CryptoCurrency,
  execute: (api: ethers.providers.JsonRpcProvider) => Promise<T>,
  retries = DEFAULT_RETRIES_RPC_METHODS
): Promise<T> {
  if (!currency?.ethereumLikeInfo?.rpc) {
    throw new Error("Currency doesn't have an RPC node provided");
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(
      currency?.ethereumLikeInfo?.rpc
    );
    return await execute(provider);
  } catch (e) {
    if (retries) {
      // decrement with prefix here or it won't work
      return withApi<T>(currency, execute, --retries);
    }
    throw e;
  }
}

/**
 * Get account balances and nonce
 */
export const getAccount: (
  currency: CryptoCurrency,
  addr: string
) => Promise<{ blockHeight: number; balance: BigNumber; nonce: number }> =
  async (currency, addr) =>
    withApi(currency, async (api) => {
      const [balance, nonce, blockHeight] = await Promise.all([
        getBalance(currency, addr),
        getTransactionCount(currency, addr),
        api.getBlockNumber(),
      ]);

      return {
        blockHeight,
        balance: new BigNumber(balance.toString()),
        nonce,
      };
    });

/**
 * Get a transaction by hash
 */
export const getTransaction = (
  currency: CryptoCurrency,
  hash: string
): Promise<ethers.providers.TransactionResponse> =>
  withApi(currency, (api) => {
    return api.getTransaction(hash);
  });

/**
 * Get the balance of an address
 */
export const getBalance = (
  currency: CryptoCurrency,
  address: string
): Promise<BigNumber> =>
  withApi(currency, async (api) => {
    const balance = await api.getBalance(address);
    return new BigNumber(balance.toString());
  });

/**
 * Get account nonce
 */
export const getTransactionCount = (
  currency: CryptoCurrency,
  addr: string
): Promise<number> =>
  withApi(currency, async (api) => {
    return api.getTransactionCount(addr);
  });

/**
 * Get an estimated gas limit for a transaction
 */
export const getGasEstimation = (
  account: Account,
  transaction: EvmTransaction
): Promise<BigNumber> =>
  withApi(account.currency, async (api) => {
    const ethersTransaction = transactionToEthersTransaction(
      transaction,
      account
    ) as ethers.providers.TransactionRequest;
    const gasEtimation = await api.estimateGas(ethersTransaction);

    return new BigNumber(gasEtimation.toString());
  });

/**
 * Get an estimation of fees on the network
 */
export const getFeesEstimation = (
  currency: CryptoCurrency
): Promise<{
  maxFeePerGas: null | BigNumber;
  maxPriorityFeePerGas: null | BigNumber;
  gasPrice: null | BigNumber;
}> =>
  withApi(currency, async (api) => {
    const feeData = await api.getFeeData();
    return {
      maxFeePerGas: feeData.maxFeePerGas
        ? new BigNumber(feeData.maxFeePerGas.toString())
        : null,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        ? new BigNumber(feeData.maxPriorityFeePerGas.toString())
        : null,
      gasPrice: feeData.gasPrice
        ? new BigNumber(feeData.gasPrice.toString())
        : null,
    };
  });

/**
 * Broadcast a serialized transaction
 */
export const broadcastTransaction = (
  currency: CryptoCurrency,
  signedTxHex: string
): Promise<ethers.providers.TransactionResponse> =>
  withApi(currency, async (api) => {
    return api.sendTransaction(signedTxHex);
  });

/**
 * Get the informations about a block by block height
 */
export const getBlock = (
  currency: CryptoCurrency,
  blockHeight: number
): Promise<ethers.providers.Block> =>
  withApi(currency, async (api) => {
    return api.getBlock(blockHeight);
  });

export default {
  DEFAULT_RETRIES_RPC_METHODS,
  withApi,
  getAccount,
  getTransaction,
  getBalance,
  getTransactionCount,
  getGasEstimation,
  getFeesEstimation,
  broadcastTransaction,
  getBlock,
};

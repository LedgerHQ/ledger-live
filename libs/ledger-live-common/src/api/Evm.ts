import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  EtherscanOperation,
  Transaction as EvmTransaction,
} from "../families/evm/types";
import { transactionToEthersTransaction } from "../families/evm/transaction";
import { makeLRUCache } from "../cache";
import network from "../network";
import {
  etherscanOperationToOperation,
  scanApiForCurrency,
} from "../families/evm/logic";

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
  currency: CryptoCurrency,
  transaction: EvmTransaction
): Promise<BigNumber> =>
  withApi(currency, async (api) => {
    const ethersTransaction = transactionToEthersTransaction(
      transaction
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

/**
 * Get all the latest "normal" transactions (no tokens / NFTs)
 */
export const getLatestTransactions = makeLRUCache<
  [
    currency: CryptoCurrency,
    address: string,
    accountId: string,
    fromBlock: number
  ],
  Operation[]
>(
  async (currency, address, accountId, fromBlock) => {
    const apiDomain = scanApiForCurrency(currency);
    if (!apiDomain) {
      return [];
    }

    let url = `${apiDomain}/api?module=account&action=txlist&address=${address}&tag=latest&page=1`;
    if (fromBlock) {
      url += `&startBlock=${fromBlock}`;
    }

    try {
      const { data }: { data: { result: EtherscanOperation[] } } =
        await network({
          method: "GET",
          url,
        });

      return data.result
        .map((tx) => etherscanOperationToOperation(accountId, address, tx))
        .filter(Boolean) as Operation[];
    } catch (e) {
      return [];
    }
  },
  (currency, address, accountId) => accountId,
  { maxAge: 6 * 1000 }
);

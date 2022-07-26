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

type AsyncApiFunction = (api: ethers.providers.JsonRpcProvider) => Promise<any>;

/**
 * Connects to RPC Node
 */
async function withApi(
  currency: CryptoCurrency,
  execute: AsyncApiFunction
): Promise<any> {
  if (!currency?.rpc) {
    throw new Error("Currency doesn't have an RPC node provided");
  }

  const provider = new ethers.providers.JsonRpcProvider(currency.rpc);
  return await execute(provider);
}

type GetAccountFn = (
  currency: CryptoCurrency,
  addr: string
) => Promise<{ blockHeight: number; balance: BigNumber; nonce: number }>;

/**
 * Get account balances and nonce
 */
export const getAccount: GetAccountFn = async (currency, addr) =>
  withApi(currency, async (api) => {
    try {
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
    } catch (e) {
      console.error(e);
    }
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
    try {
      const balance = await api.getBalance(address);
      return new BigNumber(balance.toString());
    } catch (e) {
      return new BigNumber(0);
    }
  });

/**
 * Get account nonce
 */
export const getTransactionCount = (
  currency: CryptoCurrency,
  addr: string
): Promise<number> =>
  withApi(currency, async (api) => {
    return await api.getTransactionCount(addr);
  });

/**
 * Get an estimated gas limit for a transaction
 */
export const getGasEstimation = (
  currency: CryptoCurrency,
  transaction: EvmTransaction
): Promise<BigNumber> =>
  withApi(currency, async (api) => {
    try {
      const ethersTransaction = transactionToEthersTransaction(
        transaction
      ) as ethers.providers.TransactionRequest;
      const gasEtimation = await api.estimateGas(ethersTransaction);

      return new BigNumber(gasEtimation.toString());
    } catch (e) {
      return new BigNumber(21000);
    }
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
    try {
      const feeData = await api.getFeeData();
      return {
        maxFeePerGas: feeData.maxFeePerGas
          ? new BigNumber(feeData.maxFeePerGas?.toString())
          : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
          ? new BigNumber(feeData.maxPriorityFeePerGas?.toString())
          : null,
        gasPrice: feeData.gasPrice
          ? new BigNumber(feeData.gasPrice?.toString())
          : null,
      };
    } catch (e) {
      return {
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gasPrice: null,
      };
    }
  });

/**
 * Broadcast a serialized transaction
 */
export const broadcastTransaction = (
  currency: CryptoCurrency,
  signedTxHex: string
): Promise<ethers.providers.TransactionResponse> =>
  withApi(currency, async (api) => {
    return await api.sendTransaction(signedTxHex);
  });

/**
 * Get the informations about a block by block height
 */
export const getBlock = (
  currency: CryptoCurrency,
  blockHeight: number
): Promise<ethers.providers.Block> =>
  withApi(currency, async (api) => {
    return await api.getBlock(blockHeight);
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

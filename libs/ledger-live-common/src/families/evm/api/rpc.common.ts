/** ⚠️ keep this order of import. @see https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative ⚠️ */
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { FeeData, FeeHistory, Transaction as EvmTransaction } from "../types";
import { transactionToEthersTransaction } from "../adapters";
import { GasEstimationError } from "../errors";
import ERC20Abi from "../abis/erc20.abi.json";
import { log } from "@ledgerhq/logs";

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
 * Get account balance and last chain block
 */
export const getBalanceAndBlock: (
  currency: CryptoCurrency,
  addr: string
) => Promise<{ blockHeight: number; balance: BigNumber }> = async (
  currency,
  addr
) =>
  withApi(currency, async (api) => {
    const [balance, blockHeight] = await Promise.all([
      getCoinBalance(currency, addr),
      api.getBlockNumber(),
    ]);

    return {
      blockHeight,
      balance: new BigNumber(balance.toString()),
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
export const getCoinBalance = (
  currency: CryptoCurrency,
  address: string
): Promise<BigNumber> =>
  withApi(currency, async (api) => {
    const balance = await api.getBalance(address);
    return new BigNumber(balance.toString());
  });

/**
 * Get the balance of an address
 */
export const getTokenBalance = (
  currency: CryptoCurrency,
  address: string,
  contractAddress: string
): Promise<BigNumber> =>
  withApi(currency, async (api) => {
    const erc20 = new ethers.Contract(contractAddress, ERC20Abi, api);
    const balance = await erc20.balanceOf(address);
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
    const { to, value, data } = transactionToEthersTransaction(
      transaction
    ) as ethers.providers.TransactionRequest;

    try {
      const gasEtimation = await api.estimateGas({
        from: account.freshAddress, // should be necessary for some estimations
        to,
        value,
        data,
      });

      return new BigNumber(gasEtimation.toString());
    } catch (e) {
      log("error", "EVM Family: Gas Estimation Error", e);
      throw new GasEstimationError();
    }
  });

/**
 * Get an estimation of fees on the network
 */
export const getFeesEstimation = (currency: CryptoCurrency): Promise<FeeData> =>
  withApi(currency, async (api) => {
    const block = await api.getBlock("latest");
    const supports1559 = Boolean(block.baseFeePerGas);
    const feeData = await (async () => {
      if (supports1559) {
        const feeHistory: FeeHistory = await api.send("eth_feeHistory", [
          "0x5", // Fetching the history for 5 blocks
          "latest", // from the latest block
          [50], // 50% percentile sample
        ]);
        // Taking the average priority fee used on the last 5 blocks
        const maxPriorityFeePerGas = feeHistory.reward
          .reduce(
            (acc, [curr]) => acc.plus(new BigNumber(curr)),
            new BigNumber(0)
          )
          .dividedToIntegerBy(feeHistory.reward.length);
        const nextBaseFee = new BigNumber(
          feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1]
        );

        return {
          maxPriorityFeePerGas,
          maxFeePerGas: nextBaseFee.multipliedBy(2).plus(maxPriorityFeePerGas),
        };
      } else {
        const gasPrice = await api.getGasPrice();

        return {
          gasPrice,
        };
      }
    })();

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
 * Get account balances and nonce
 */
export const getSubAccount: (
  currency: CryptoCurrency,
  addr: string
) => Promise<{ blockHeight: number; balance: BigNumber; nonce: number }> =
  async (currency, addr) =>
    withApi(currency, async (api) => {
      const [balance, nonce, blockHeight] = await Promise.all([
        getCoinBalance(currency, addr),
        getTransactionCount(currency, addr),
        api.getBlockNumber(),
      ]);

      return {
        blockHeight,
        balance: new BigNumber(balance.toString()),
        nonce,
      };
    });

export default {
  DEFAULT_RETRIES_RPC_METHODS,
  withApi,
  getBalanceAndBlock,
  getTransaction,
  getCoinBalance,
  getTransactionCount,
  getGasEstimation,
  getFeesEstimation,
  broadcastTransaction,
  getBlock,
};

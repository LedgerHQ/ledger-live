/** ⚠️ keep this order of import. @see https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative ⚠️ */
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { delay } from "@ledgerhq/live-promise";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import OptimismGasPriceOracleAbi from "../abis/optimismGasPriceOracle.abi.json";
import { FeeData, FeeHistory, Transaction as EvmTransaction } from "../types";
import { GasEstimationError, InsufficientFunds } from "../errors";
import { transactionToEthersTransaction } from "../adapters";
import { getSerializedTransaction } from "../transaction";
import ERC20Abi from "../abis/erc20.abi.json";

export const RPC_TIMEOUT = 5000; // wait 5 sec after a fail
export const DEFAULT_RETRIES_RPC_METHODS = 3;

/**
 * Cache for RPC providers to avoid recreating the connection on every usage of `withApi`
 * Without this, ethers will create a new provider and use the `eth_chainId` RPC call
 * at instanciation which could result in rate limits being reached
 * on some specific nodes (E.g. the main Optimism RPC)
 */
const PROVIDERS_BY_RPC: Record<string, ethers.providers.StaticJsonRpcProvider> = {};

/**
 * Connects to RPC Node
 *
 * ⚠️ Make sure to always use a `StaticJsonRpcProvider` and not a `JsonRpcProvider`
 * because the latter will use a `eth_chainId` before every request in order
 * to check if the node used changed (as per EIP-1193 standard)
 * @see https://github.com/ethers-io/ethers.js/issues/901
 */
export async function withApi<T>(
  currency: CryptoCurrency,
  execute: (api: ethers.providers.StaticJsonRpcProvider) => Promise<T>,
  retries = DEFAULT_RETRIES_RPC_METHODS,
): Promise<T> {
  if (!currency?.ethereumLikeInfo?.rpc) {
    throw new Error("Currency doesn't have an RPC node provided");
  }

  try {
    if (!PROVIDERS_BY_RPC[currency.ethereumLikeInfo.rpc]) {
      PROVIDERS_BY_RPC[currency.ethereumLikeInfo.rpc] = new ethers.providers.StaticJsonRpcProvider(
        currency.ethereumLikeInfo.rpc,
      );
    }

    const provider = PROVIDERS_BY_RPC[currency.ethereumLikeInfo.rpc];
    return await execute(provider);
  } catch (e) {
    if (retries) {
      // wait the RPC timeout before trying again
      await delay(RPC_TIMEOUT);
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
  addr: string,
) => Promise<{ blockHeight: number; balance: BigNumber }> = async (currency, addr) =>
  withApi(currency, async api => {
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
  hash: string,
): Promise<ethers.providers.TransactionResponse> =>
  withApi(currency, api => {
    return api.getTransaction(hash);
  });

/**
 * Get the balance of an address
 */
export const getCoinBalance = (currency: CryptoCurrency, address: string): Promise<BigNumber> =>
  withApi(currency, async api => {
    const balance = await api.getBalance(address);
    return new BigNumber(balance.toString());
  });

/**
 * Get the balance of an address
 */
export const getTokenBalance = (
  currency: CryptoCurrency,
  address: string,
  contractAddress: string,
): Promise<BigNumber> =>
  withApi(currency, async api => {
    const erc20 = new ethers.Contract(contractAddress, ERC20Abi, api);
    const balance = await erc20.balanceOf(address);
    return new BigNumber(balance.toString());
  });

/**
 * Get account nonce
 */
export const getTransactionCount = (currency: CryptoCurrency, addr: string): Promise<number> =>
  withApi(currency, async api => {
    return api.getTransactionCount(addr);
  });

/**
 * Get an estimated gas limit for a transaction
 */
export const getGasEstimation = (
  account: Account,
  transaction: EvmTransaction,
): Promise<BigNumber> =>
  withApi(account.currency, async api => {
    const { to, value, data } = transactionToEthersTransaction(transaction);

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
  withApi(currency, async api => {
    const block = await api.getBlock("latest");
    const currencySupports1559 = Boolean(block.baseFeePerGas);

    const feeData = await (async () => {
      if (currencySupports1559) {
        const feeHistory: FeeHistory = await api.send("eth_feeHistory", [
          "0x5", // Fetching the history for 5 blocks
          "latest", // from the latest block
          [50], // 50% percentile sample
        ]);
        // Taking the average priority fee used on the last 5 blocks
        const maxPriorityFeeAverage = feeHistory.reward
          .reduce((acc, [curr]) => acc.plus(new BigNumber(curr)), new BigNumber(0))
          .dividedToIntegerBy(feeHistory.reward.length);

        // A maxPriorityFeePerGas too low might make a transaction stuck forever
        // As a safety measure, if maxPriorityFeePerGas is zero
        // we enforce a 1 Gwei value
        const maxPriorityFeePerGas = maxPriorityFeeAverage.isZero()
          ? new BigNumber(1e9) // 1 Gwei
          : maxPriorityFeeAverage;

        const nextBaseFee = new BigNumber(
          feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1],
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
      maxFeePerGas: feeData.maxFeePerGas ? new BigNumber(feeData.maxFeePerGas.toString()) : null,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        ? new BigNumber(feeData.maxPriorityFeePerGas.toString())
        : null,
      gasPrice: feeData.gasPrice ? new BigNumber(feeData.gasPrice.toString()) : null,
    };
  });

/**
 * Broadcast a serialized transaction
 */
export const broadcastTransaction = (
  currency: CryptoCurrency,
  signedTxHex: string,
): Promise<ethers.providers.TransactionResponse> =>
  withApi(
    currency,
    async api => {
      try {
        return await api.sendTransaction(signedTxHex);
      } catch (e) {
        if ((e as Error & { code: string }).code === "INSUFFICIENT_FUNDS") {
          log("error", "EVM Family: Wrong estimation of fees", e);
          throw new InsufficientFunds();
        }
        throw e;
      }
    },
    0,
  );

/**
 * Get the informations about a block by block height
 */
export const getBlock = (
  currency: CryptoCurrency,
  blockHeight: number,
): Promise<ethers.providers.Block> =>
  withApi(currency, async api => {
    return api.getBlock(blockHeight);
  });

/**
 * Get account balances and nonce
 */
export const getSubAccount: (
  currency: CryptoCurrency,
  addr: string,
) => Promise<{
  blockHeight: number;
  balance: BigNumber;
  nonce: number;
}> = async (currency, addr) =>
  withApi(currency, async api => {
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

/**
 * ⚠️ Blockchain specific
 *
 * For a layer 2 like Optimism, additional fees are needed in order to
 * take into account layer 1 settlement estimated cost.
 * This gas price is served through a smart contract oracle.
 *
 * @see https://help.optimism.io/hc/en-us/articles/4411895794715-How-do-transaction-fees-on-Optimism-work-
 */
export const getOptimismAdditionalFees = makeLRUCache<[CryptoCurrency, EvmTransaction], BigNumber>(
  async (currency, transaction) =>
    withApi(currency, async api => {
      if (!["optimism", "optimism_goerli"].includes(currency.id)) {
        return new BigNumber(0);
      }

      // Fake signature is added to get the best approximation possible for the gas on L1
      const serializedTransaction = (() => {
        try {
          return getSerializedTransaction(transaction, {
            r: "0xffffffffffffffffffffffffffffffffffffffff",
            s: "0xffffffffffffffffffffffffffffffffffffffff",
            v: 0,
          });
        } catch (e) {
          return null;
        }
      })();
      if (!serializedTransaction) {
        return new BigNumber(0);
      }

      const optimismGasOracle = new ethers.Contract(
        // contract address provided here
        // @see https://community.optimism.io/docs/developers/build/transaction-fees/#displaying-fees-to-users
        "0x420000000000000000000000000000000000000F",
        OptimismGasPriceOracleAbi,
        api,
      );
      const additionalL1Fees = await optimismGasOracle.getL1Fee(serializedTransaction);
      return new BigNumber(additionalL1Fees.toString());
    }),
  (currency, transaction) => {
    const serializedTransaction = (() => {
      try {
        return getSerializedTransaction(transaction);
      } catch (e) {
        return null;
      }
    })();

    return "getOptimismL1BaseFee_" + currency.id + "_" + serializedTransaction;
  },
  { ttl: 15 * 1000 }, // preventing rate limit by caching this for at least 15sec
);

export default {
  DEFAULT_RETRIES_RPC_METHODS,
  RPC_TIMEOUT,
  withApi,
  getBalanceAndBlock,
  getTransaction,
  getCoinBalance,
  getTransactionCount,
  getGasEstimation,
  getFeesEstimation,
  broadcastTransaction,
  getBlock,
  getOptimismAdditionalFees,
};

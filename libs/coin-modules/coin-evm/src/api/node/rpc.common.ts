/** ⚠️ keep this order of import. @see https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative ⚠️ */
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import OptimismGasPriceOracleAbi from "../../abis/optimismGasPriceOracle.abi.json";
import ScrollGasPriceOracleAbi from "../../abis/scrollGasPriceOracle.abi.json";
import { GasEstimationError, InsufficientFunds } from "../../errors";
import { transactionToEthersTransaction } from "../../adapters";
import { getSerializedTransaction } from "../../transaction";
import ERC20Abi from "../../abis/erc20.abi.json";
import { getCoinConfig } from "../../config";
import { FeeHistory } from "../../types";
import { NodeApi, isExternalNodeConfig } from "./types";

export const RPC_TIMEOUT =
  process.env.NODE_ENV === "test"
    ? 100
    : /* istanbul ignore next: prod values don't change the behaviour of the test */ 5000; // wait 5 sec after a fail
export const DEFAULT_RETRIES_RPC_METHODS =
  process.env.NODE_ENV === "test"
    ? 1
    : /* istanbul ignore next: prod values don't change the behaviour of the test */ 3;

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
  const config = getCoinConfig(currency).info;

  const { node } = config || /* istanbul ignore next: catched right after if empty */ {};
  if (!isExternalNodeConfig(node)) {
    throw new Error("Currency doesn't have an RPC node provided");
  }

  try {
    if (!PROVIDERS_BY_RPC[node.uri]) {
      PROVIDERS_BY_RPC[node.uri] = new ethers.providers.StaticJsonRpcProvider(node.uri);
    }

    const provider = PROVIDERS_BY_RPC[node.uri];
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
 * Get a transaction by hash
 */
export const getTransaction: NodeApi["getTransaction"] = (currency, txHash) =>
  withApi(currency, async api => {
    const [
      { hash, blockNumber: blockHeight, blockHash, nonce, value },
      { gasUsed, effectiveGasPrice },
    ] = await Promise.all([api.getTransaction(txHash), api.getTransactionReceipt(txHash)]);

    return {
      hash,
      blockHeight,
      blockHash,
      nonce,
      gasUsed: gasUsed.toString(),
      gasPrice: effectiveGasPrice.toString(),
      value: value.toString(),
    };
  });

/**
 * Get the balance of an address
 */
export const getCoinBalance: NodeApi["getCoinBalance"] = (currency, address) =>
  withApi(currency, async api => {
    const balance = await api.getBalance(address);
    return new BigNumber(balance.toString());
  });

/**
 * Get the balance of an address
 */
export const getTokenBalance: NodeApi["getTokenBalance"] = (currency, address, contractAddress) =>
  withApi(currency, async api => {
    const erc20 = new ethers.Contract(contractAddress, ERC20Abi, api);
    const balance = await erc20.balanceOf(address);
    return new BigNumber(balance.toString());
  });

/**
 * Get account nonce
 */
export const getTransactionCount: NodeApi["getTransactionCount"] = (currency, address) =>
  withApi(currency, async api => {
    return api.getTransactionCount(address, "pending");
  });

/**
 * Get an estimated gas limit for a transaction
 */
export const getGasEstimation: NodeApi["getGasEstimation"] = (account, transaction) =>
  withApi(
    account.currency,
    async api => {
      const { to, value, data } = transactionToEthersTransaction(transaction);

      try {
        const gasEstimation = await api.estimateGas({
          ...(to ? { to } : /* istanbul ignore next: no problem not having a to */ {}),
          from: account.freshAddress, // Necessary as no signature to infer the sender
          value,
          data,
        });

        return new BigNumber(gasEstimation.toString());
      } catch (e) {
        log("error", "EVM Family: Gas Estimation Error", e);
        throw new GasEstimationError();
      }
    },
    // we don't want to retry this method because it can fail for valid reasons
    0,
  );

/**
 * Get an estimation of fees on the network
 */
export const getFeeData: NodeApi["getFeeData"] = currency =>
  withApi(currency, async api => {
    const block = await api.getBlock("latest");
    const currencySupports1559 = getEnv("EVM_FORCE_LEGACY_TRANSACTIONS")
      ? false
      : Boolean(block.baseFeePerGas);

    const feeData = await (async (): Promise<
      | {
          maxPriorityFeePerGas: BigNumber;
          maxFeePerGas: BigNumber;
          nextBaseFee: BigNumber;
          gasPrice?: undefined;
        }
      | {
          maxPriorityFeePerGas?: undefined;
          maxFeePerGas?: undefined;
          nextBaseFee?: undefined;
          gasPrice: ethers.BigNumber;
        }
    > => {
      if (currencySupports1559) {
        const feeHistory: FeeHistory = await api.send("eth_feeHistory", [
          "0x5", // Fetching the history for 5 blocks
          "latest", // from the latest block
          [50], // 50% percentile sample
        ]);
        // Taking the average priority fee used on the last 5 blocks
        const maxPriorityFeeAverage = feeHistory.reward
          ? feeHistory.reward
              .reduce((acc, [curr]) => acc.plus(new BigNumber(curr)), new BigNumber(0))
              .dividedToIntegerBy(feeHistory.reward.length)
          : new BigNumber(0);

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
          nextBaseFee,
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
      nextBaseFee: feeData.nextBaseFee ? new BigNumber(feeData.nextBaseFee.toString()) : null,
    };
  });

/**
 * Broadcast a serialized transaction and returns its hash
 */
export const broadcastTransaction: NodeApi["broadcastTransaction"] = (currency, signedTxHex) =>
  withApi(
    currency,
    async api => {
      try {
        const { hash } = await api.sendTransaction(signedTxHex);
        return hash;
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
export const getBlockByHeight: NodeApi["getBlockByHeight"] = (currency, blockHeight = "latest") =>
  withApi(currency, async api => {
    const { hash, number, timestamp } = await api.getBlock(blockHeight);

    return {
      hash,
      height: number,
      // timestamp is returned in seconds by getBlock, we need milliseconds
      timestamp: timestamp * 1000,
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
export const getOptimismAdditionalFees: NodeApi["getOptimismAdditionalFees"] = makeLRUCache(
  async (currency, transaction) =>
    withApi(currency, async api => {
      if (!["optimism", "optimism_sepolia", "base", "base_sepolia"].includes(currency.id)) {
        return new BigNumber(0);
      }

      // Fake signature is added to get the best approximation possible for the gas on L1
      const serializedTransaction = ((): string | null => {
        try {
          return getSerializedTransaction(transaction, {
            r: "0xffffffffffffffffffffffffffffffffffffffff",
            s: "0xffffffffffffffffffffffffffffffffffffffff",
            v: 0,
          });
        } catch (error) /* istanbul ignore next: just logs */ {
          log("coin-evm", "getOptimismAdditionalFees: Transaction serializing failed", { error });
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
    const serializedTransaction = ((): string | null => {
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

/**
 * ⚠️ Blockchain specific
 *
 * For a layer 2 like Scroll, additional fees are needed in order to
 * take into account layer 1 settlement estimated cost.
 * This gas price is served through a smart contract oracle.
 *
 * @see https://docs.scroll.io/en/developers/transaction-fees-on-scroll/
 */
export const getScrollAdditionalFees: NodeApi["getScrollAdditionalFees"] = (
  currency,
  transaction,
) =>
  withApi(currency, async api => {
    if (!["scroll", "scroll_sepolia"].includes(currency.id)) {
      return new BigNumber(0);
    }

    // Fake signature is added to get the best approximation possible for the gas on L1
    const serializedTransaction = ((): string | null => {
      try {
        return getSerializedTransaction(transaction, {
          r: "0xffffffffffffffffffffffffffffffffffffffff",
          s: "0xffffffffffffffffffffffffffffffffffffffff",
          v: 0,
        });
      } catch (error) /* istanbul ignore next: just logs */ {
        log("coin-evm", "getScrollAdditionalFees: Transaction serializing failed", { error });
        return null;
      }
    })();

    if (!serializedTransaction) {
      return new BigNumber(0);
    }

    const scrollGasOracle = new ethers.Contract(
      // contract address provided here
      // @see https://docs.scroll.io/en/developers/transaction-fees-on-scroll/#estimating-the-l1-data-fee
      "0x5300000000000000000000000000000000000002",
      ScrollGasPriceOracleAbi,
      api,
    );
    const additionalL1Fees = await scrollGasOracle.getL1Fee(serializedTransaction);
    return new BigNumber(additionalL1Fees.toString());
  });

const node: NodeApi = {
  getBlockByHeight,
  getCoinBalance,
  getTokenBalance,
  getTransactionCount,
  getTransaction,
  getGasEstimation,
  getFeeData,
  broadcastTransaction,
  getOptimismAdditionalFees,
  getScrollAdditionalFees,
};

export default node;

/** ⚠️ keep this order of import. @see https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative ⚠️ */
import { getEnv } from "@ledgerhq/live-env";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { delay } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { ethers, JsonRpcProvider, Log } from "ethers";
import ERC20Abi from "../../abis/erc20.abi.json";
import OptimismGasPriceOracleAbi from "../../abis/optimismGasPriceOracle.abi.json";
import ScrollGasPriceOracleAbi from "../../abis/scrollGasPriceOracle.abi.json";
import { getCoinConfig } from "../../config";
import { GasEstimationError, InsufficientFunds } from "../../errors";
import { getSerializedTransaction } from "../../transaction";
import { FeeHistory } from "../../types";
import { safeEncodeEIP55, normalizeAddress } from "../../utils";
import { NodeApi, isExternalNodeConfig, ERC20Transfer } from "./types";

/**
 * ERC20 Transfer event topic: keccak256("Transfer(address,address,uint256)")
 *
 * Note: ERC721 uses the same signature but with tokenId indexed (4 topics).
 * ERC1155 uses different events (TransferSingle/TransferBatch).
 */
export const ERC20_TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/**
 * Parse ERC20 Transfer events from transaction receipt logs.
 *
 * ERC20 Transfer event structure:
 * - topic[0]: event signature hash (0xddf252ad...)
 * - topic[1]: from address (indexed, padded to 32 bytes)
 * - topic[2]: to address (indexed, padded to 32 bytes)
 * - data: value (uint256, 32 bytes)
 * - log.address: token contract address
 *
 * Distinction from other standards:
 * - ERC20:   3 topics (sig, from, to) + value in data
 * - ERC721:  4 topics (sig, from, to, tokenId) - filtered out by topics.length === 3
 * - ERC1155: different event signature - filtered out by topic[0] check
 *
 * @param logs - Array of logs from transaction receipt
 * @returns Array of parsed ERC20 transfers
 */
export function parseERC20TransfersFromLogs(logs: ReadonlyArray<Log>): ERC20Transfer[] {
  return logs
    .filter(
      log =>
        log.topics[0] === ERC20_TRANSFER_TOPIC && log.topics.length === 3 && log.data.length > 2, // must have data beyond "0x"
    )
    .map(log => ({
      asset: {
        type: "erc20" as const,
        assetReference: safeEncodeEIP55(log.address),
      },
      from: safeEncodeEIP55("0x" + log.topics[1].slice(26)),
      to: safeEncodeEIP55("0x" + log.topics[2].slice(26)),
      value: BigInt(log.data).toString(),
    }));
}

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
const PROVIDERS_BY_RPC: Record<string, JsonRpcProvider> = {};

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
  execute: (api: JsonRpcProvider) => Promise<T>,
  retries = DEFAULT_RETRIES_RPC_METHODS,
): Promise<T> {
  const config = getCoinConfig(currency).info;

  const { node } = config || /* istanbul ignore next: catched right after if empty */ {};
  if (!isExternalNodeConfig(node)) {
    throw new Error("Currency doesn't have an RPC node provided");
  }
  try {
    if (!PROVIDERS_BY_RPC[currency.id]) {
      const chainId = currency.ethereumLikeInfo?.chainId;
      PROVIDERS_BY_RPC[currency.id] = new JsonRpcProvider(node.uri, chainId);
    }

    const provider = PROVIDERS_BY_RPC[currency.id];
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
    const [tx, receipt] = await Promise.all([
      api.getTransaction(txHash),
      api.getTransactionReceipt(txHash),
    ]);

    if (!tx || !receipt) {
      throw new Error("Transaction or receipt not found");
    }

    return {
      hash: tx.hash,
      blockHeight: tx.blockNumber ?? undefined,
      blockHash: tx.blockHash ?? undefined,
      nonce: tx.nonce,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: receipt.gasPrice.toString(),
      status: receipt.status,
      value: tx.value.toString(),
      from: tx.from,
      to: tx.to ?? undefined,
      erc20Transfers: parseERC20TransfersFromLogs(receipt.logs),
    };
  });

/**
 * Get the balance of an address
 */
export const getCoinBalance: NodeApi["getCoinBalance"] = (currency, address) =>
  withApi(currency, async api => {
    const balance = await api.getBalance(normalizeAddress(address));
    return new BigNumber(balance.toString());
  });

/**
 * Get the balance of an address
 */
export const getTokenBalance: NodeApi["getTokenBalance"] = (currency, address, contractAddress) =>
  withApi(currency, async api => {
    const erc20 = new ethers.Contract(normalizeAddress(contractAddress), ERC20Abi, api);
    const balance = await erc20.balanceOf(normalizeAddress(address));
    return new BigNumber(balance.toString());
  });

/**
 * Get account nonce
 */
export const getTransactionCount: NodeApi["getTransactionCount"] = (currency, address) =>
  withApi(currency, async api => {
    return api.getTransactionCount(normalizeAddress(address), "pending");
  });

/**
 * Get an estimated gas limit for a transaction
 */
export const getGasEstimation: NodeApi["getGasEstimation"] = (account, transaction) =>
  withApi(
    account.currency,
    async api => {
      const to = transaction.recipient ? normalizeAddress(transaction.recipient) : undefined;
      const value = BigInt(transaction.amount.toFixed(0));
      const data = transaction.data ? `0x${transaction.data.toString("hex")}` : "";

      try {
        const gasEstimation = await api.estimateGas({
          ...(to ? { to } : /* istanbul ignore next: no problem not having a to */ {}),
          from: normalizeAddress(account.freshAddress), // Necessary as no signature to infer the sender
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
export const getFeeData: NodeApi["getFeeData"] = (currency, transaction) =>
  withApi(currency, async api => {
    const block = await api.getBlock("latest");
    const currencySupports1559 = getEnv("EVM_FORCE_LEGACY_TRANSACTIONS")
      ? false
      : transaction.type === 2 && Boolean(block?.baseFeePerGas);

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
          gasPrice: BigNumber;
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
          ? getMaxPriorityFeePerGas(currency)
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
        const gasPrice = (await api.getFeeData()).gasPrice;

        return {
          gasPrice: new BigNumber(gasPrice?.toString() ?? "0"),
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
        const { hash } = await api.broadcastTransaction(signedTxHex);
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
    const block = await api.getBlock(blockHeight);

    if (!block) {
      throw new Error(`Block ${blockHeight} not found`);
    }

    if (!block.hash) {
      throw new Error(`Block ${blockHeight} is missing hash`);
    }

    const transactionHashes = block.transactions as string[] | undefined;

    return {
      hash: block.hash,
      height: block.number ?? 0,
      // timestamp is returned in seconds by getBlock, we need milliseconds
      timestamp: block.timestamp * 1000,
      parentHash: block.parentHash,
      ...(transactionHashes !== undefined && { transactionHashes }),
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
      if (
        ![
          "optimism",
          "optimism_sepolia",
          "base",
          "base_sepolia",
          "blast",
          "blast_sepolia",
        ].includes(currency.id)
      ) {
        return new BigNumber(0);
      }

      // Fake signature is added to get the best approximation possible for the gas on L1
      const serializedTransaction =
        typeof transaction === "string"
          ? transaction
          : ((): string | null => {
              try {
                return getSerializedTransaction(transaction, {
                  r: "0xffffffffffffffffffffffffffffffffffffffff",
                  s: "0xffffffffffffffffffffffffffffffffffffffff",
                  v: 27,
                });
              } catch (error) /* istanbul ignore next: just logs */ {
                log("coin-evm", "getOptimismAdditionalFees: Transaction serializing failed", {
                  error,
                });
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
    const serializedTransaction =
      typeof transaction === "string"
        ? transaction
        : ((): string | null => {
            try {
              return getSerializedTransaction(transaction);
            } catch {
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
    const serializedTransaction =
      typeof transaction === "string"
        ? transaction
        : ((): string | null => {
            try {
              return getSerializedTransaction(transaction, {
                r: "0xffffffffffffffffffffffffffffffffffffffff",
                s: "0xffffffffffffffffffffffffffffffffffffffff",
                v: 27,
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

/* Get default maxPriorityFeePerGas by chain */
const getMaxPriorityFeePerGas = (currency: CryptoCurrency): BigNumber => {
  switch (currency.id) {
    case "zero_gravity":
      return new BigNumber(2e9); // 2 Gwei
    default:
      return new BigNumber(1e9); // 1 Gwei
  }
};

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

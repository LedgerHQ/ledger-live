/** ⚠️ keep this order of import. @see https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative ⚠️ */
import { getEnv } from "@ledgerhq/live-env";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ethers, JsonRpcProvider } from "ethers";
import ERC20Abi from "../../abis/erc20.abi.json";
import OptimismGasPriceOracleAbi from "../../abis/optimismGasPriceOracle.abi.json";
import ScrollGasPriceOracleAbi from "../../abis/scrollGasPriceOracle.abi.json";
import { ExternalNodeConfig } from "../../config";
import { GasEstimationError, InsufficientFunds, UnsupportedRpcMethodError } from "../../errors";
import { FeeHistory, FeeData, Transaction as EvmTransaction } from "../../types";
import { safeEncodeEIP55, normalizeAddress } from "../../utils";
import { withRetries } from "../withRetries";
import { gethCallTracerToTraceBlockItems } from "./gethCallTracerToTraceBlockItems";
import {
  hasErrorCode,
  isUnsupportedRpcMethodErrorMsg,
  isUnsupportedRpcMethodError,
} from "./rpc.errors";
import {
  NodeApi,
  ERC20Transfer,
  PrefetchedBlockTransaction,
  LogWithAddress,
  TransactionReceipt,
  TraceBlockItem,
  isTraceBlockItem,
  TransactionInfo,
  BlockByHeightResult,
  BlockReceiptInfo,
} from "./types";

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
export function parseERC20TransfersFromLogs(logs: ReadonlyArray<LogWithAddress>): ERC20Transfer[] {
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
 * Keyed by currency id + RPC URI so the same chain with different uri gets distinct providers.
 */
const PROVIDERS_BY_RPC: Record<string, JsonRpcProvider> = {};

function providerCacheKey(currencyId: string, uri: string): string {
  return `${currencyId}:${uri}`;
}

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
  nodeConfig: ExternalNodeConfig,
): Promise<T> {
  const retries = nodeConfig.retries ?? DEFAULT_RETRIES_RPC_METHODS;
  return withRetries(
    async () => {
      const key = providerCacheKey(currency.id, nodeConfig.uri);
      if (!PROVIDERS_BY_RPC[key]) {
        const chainId = currency.ethereumLikeInfo?.chainId;
        PROVIDERS_BY_RPC[key] = new JsonRpcProvider(nodeConfig.uri, chainId);
      }
      const provider = PROVIDERS_BY_RPC[key];
      return await execute(provider);
    },
    retries,
    RPC_TIMEOUT,
  );
}

async function getTransaction(
  api: JsonRpcProvider,
  _currency: CryptoCurrency,
  txHash: string,
): Promise<TransactionInfo> {
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
}

async function getCoinBalance(
  api: JsonRpcProvider,
  _currency: CryptoCurrency,
  address: string,
): Promise<BigNumber> {
  const balance = await api.getBalance(normalizeAddress(address));
  return new BigNumber(balance.toString());
}

async function getTokenBalance(
  api: JsonRpcProvider,
  _currency: CryptoCurrency,
  address: string,
  contractAddress: string,
): Promise<BigNumber> {
  const erc20 = new ethers.Contract(normalizeAddress(contractAddress), ERC20Abi, api);
  const balance = await erc20.balanceOf(normalizeAddress(address));
  return new BigNumber(balance.toString());
}

async function getTransactionCount(
  api: JsonRpcProvider,
  _currency: CryptoCurrency,
  address: string,
): Promise<number> {
  return api.getTransactionCount(normalizeAddress(address), "pending");
}

async function getGasEstimation(
  api: JsonRpcProvider,
  _currency: CryptoCurrency,
  account: Pick<Account, "freshAddress">,
  transaction: Pick<EvmTransaction, "amount" | "data" | "recipient">,
): Promise<BigNumber> {
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
}

function makeGetGasEstimation(nodeConfig: ExternalNodeConfig): NodeApi["getGasEstimation"] {
  return (account, transaction) =>
    withApi(
      account.currency,
      api => getGasEstimation(api, account.currency, account, transaction),
      {
        ...nodeConfig,
        retries: 0,
      },
    );
}

async function getFeeData(
  api: JsonRpcProvider,
  currency: CryptoCurrency,
  transaction: Pick<EvmTransaction, "type" | "feesStrategy">,
): Promise<FeeData> {
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
}

async function broadcastTransaction(
  api: JsonRpcProvider,
  _currency: CryptoCurrency,
  signedTxHex: string,
): Promise<string> {
  try {
    const { hash } = await api.broadcastTransaction(signedTxHex);
    return hash;
  } catch (e) {
    if (hasErrorCode(e, "INSUFFICIENT_FUNDS")) {
      log("error", "EVM Family: Wrong estimation of fees", e);
      throw new InsufficientFunds();
    }
    throw e;
  }
}

async function getBlockByHeight(
  api: JsonRpcProvider,
  _currency: CryptoCurrency,
  blockHeight: number | "latest",
  prefetchTxs?: boolean,
): Promise<BlockByHeightResult> {
  let block: ethers.Block | null;
  try {
    block = await api.getBlock(blockHeight, prefetchTxs);
  } catch (error) {
    // Some chains (e.g. zkSync) can return tx objects missing signature fields, ethers then fails while formatting
    // prefetched transactions => we fallback to a custom getBlock implementation
    if (prefetchTxs && isSignatureError(error)) {
      log("warn", "EVM getBlock fallback: using raw eth_getBlockByNumber response", {
        blockHeight,
        error: String(error),
      });
      return getBlockByHeightFromRawRpc(api, blockHeight, true);
    }
    throw error;
  }

  if (!block) {
    throw new Error(`Block ${blockHeight} not found`);
  }

  if (!block.hash) {
    throw new Error(`Block ${blockHeight} is missing hash`);
  }

  const transactionHashes =
    block.transactions === undefined
      ? undefined
      : block.transactions.map((tx, index) => {
          if (typeof tx !== "string") {
            throw new TypeError(
              `Block ${blockHeight} contains malformed transaction hash at index ${index}`,
            );
          }
          return tx;
        });

  const prefetchedTransactions = prefetchTxs ? getPrefetchedBlockTransactions(block) : undefined;
  const transactions = prefetchedTransactions?.map((tx, index) => {
    if (!isPrefetchedBlockTransaction(tx))
      throw new Error(
        `Block ${blockHeight} contains malformed prefetched transaction at index ${index}`,
      );

    return {
      hash: tx.hash,
      value: tx.value.toString(),
      from: tx.from,
      to: tx.to ?? undefined,
    };
  });

  return {
    hash: block.hash,
    height: block.number ?? 0,
    // timestamp is returned in seconds by getBlock, we need milliseconds
    timestamp: block.timestamp * 1000,
    parentHash: block.parentHash,
    ...(transactions !== undefined && { transactions }),
    ...(transactionHashes !== undefined && { transactionHashes }),
  };
}

/** Specific error thrown by ethers when handling zksync blocks with missing signature fields in prefetched transactions */
function isSignatureError(error: unknown): boolean {
  if (!hasErrorCode(error, "INVALID_ARGUMENT")) return false;
  if (typeof error !== "object" || error === null) return false;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ethersError = error as { argument?: unknown };
  return ethersError.argument === "signature";
}

/**
 * Parse a quantity (eg: amount or block height) return from an RPC.
 *
 * @param value raw RPC value
 * @param fieldName dereferenced field, for error display only
 */
function parseRpcHexQuantity(value: unknown, fieldName: string): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(BigInt(value));
  throw new Error(`Malformed ${fieldName} in eth_getBlockByNumber response`);
}

/**
 * Fallback implementation of {@link getBlockByHeight} using raw RPC call to eth_getBlockByNumber, to handle cases where
 * ethers fails to parse the block due to malformed prefetched transactions (e.g. missing signature fields in zkSync
 * blocks).
 */
async function getBlockByHeightFromRawRpc(
  api: JsonRpcProvider,
  blockHeight: number | "latest",
  prefetchTxs: boolean,
): Promise<BlockByHeightResult> {
  const blockTag = blockHeight === "latest" ? "latest" : ethers.toQuantity(blockHeight);
  const rawBlock = await api.send("eth_getBlockByNumber", [blockTag, prefetchTxs]);
  if (typeof rawBlock !== "object" || rawBlock === null)
    throw new Error("Invalid eth_getBlockByNumber response");

  const block = rawBlock as Record<string, unknown>;
  if (typeof block.hash !== "string")
    throw new Error("Malformed block hash in eth_getBlockByNumber");
  if (typeof block.parentHash !== "string")
    throw new Error("Malformed block parentHash in eth_getBlockByNumber");

  const height = parseRpcHexQuantity(block.number, "block.number");
  const timestampInSeconds = parseRpcHexQuantity(block.timestamp, "block.timestamp");
  const rawTransactions = block.transactions;
  if (rawTransactions !== undefined && !Array.isArray(rawTransactions))
    throw new Error("Malformed block.transactions in eth_getBlockByNumber response");

  const transactionHashes = rawTransactions?.map((tx, index) => {
    if (typeof tx === "string") return tx;
    if (typeof tx === "object" && tx !== null && "hash" in tx && typeof tx.hash === "string")
      return tx.hash;
    throw new Error(
      `Malformed block transaction at index ${index} in eth_getBlockByNumber response`,
    );
  });

  const transactions =
    prefetchTxs && rawTransactions
      ? rawTransactions.map(tx => {
          if (typeof tx === "string")
            throw new Error("Expected prefetched transaction object, got hash string");
          if (typeof tx !== "object" || tx === null)
            throw new Error("Malformed prefetched transaction in eth_getBlockByNumber response");
          if (!("hash" in tx) || typeof tx.hash !== "string")
            throw new Error(
              "Malformed prefetched transaction hash in eth_getBlockByNumber response",
            );
          if (!("from" in tx) || typeof tx.from !== "string")
            throw new Error(
              "Malformed prefetched transaction from in eth_getBlockByNumber response",
            );
          if ("to" in tx && tx.to !== null && tx.to !== undefined && typeof tx.to !== "string")
            throw new Error("Malformed prefetched transaction to in eth_getBlockByNumber response");
          if ("value" in tx && tx.value !== undefined && typeof tx.value !== "string")
            throw new Error(
              "Malformed prefetched transaction value in eth_getBlockByNumber response",
            );

          return {
            hash: tx.hash,
            value: BigInt(tx.value ?? "0x0").toString(),
            from: tx.from,
            to: tx.to ?? undefined,
          };
        })
      : undefined;

  return {
    hash: block.hash,
    height,
    timestamp: timestampInSeconds * 1000,
    parentHash: block.parentHash,
    ...(transactions !== undefined && { transactions }),
    ...(transactionHashes !== undefined && { transactionHashes }),
  };
}

async function getBlockReceipts(
  api: JsonRpcProvider,
  _currency: CryptoCurrency,
  blockHeight: number | "latest",
): Promise<BlockReceiptInfo[]> {
  const blockTag = blockHeight === "latest" ? "latest" : ethers.toQuantity(blockHeight);
  let receipts: unknown;
  try {
    receipts = await api.send("eth_getBlockReceipts", [blockTag]);
  } catch (error) {
    if (isUnsupportedRpcMethodError(error)) {
      throw new UnsupportedRpcMethodError(
        "eth_getBlockReceipts is not supported by this RPC provider",
        {
          method: "eth_getBlockReceipts",
          rawError: error,
        },
      );
    }
    throw error;
  }

  if (!Array.isArray(receipts)) throw new Error("Invalid eth_getBlockReceipts response");

  return receipts.map((receipt, index) => {
    if (!isTransactionReceipt(receipt))
      throw new Error(`Malformed eth_getBlockReceipts response at index ${index}`);

    return {
      hash: receipt.transactionHash,
      gasUsed: BigInt(receipt.gasUsed).toString(),
      gasPrice: BigInt(receipt.effectiveGasPrice ?? receipt.gasPrice ?? "0x0").toString(),
      status: receipt.status === null ? null : Number(receipt.status),
      erc20Transfers: parseERC20TransfersFromLogs(receipt.logs),
    };
  });
}

async function traceBlockGeth(
  api: JsonRpcProvider,
  blockHeight: number,
): Promise<TraceBlockItem[]> {
  const rpcBlockTag = ethers.toQuantity(blockHeight);

  let debugResults: unknown;
  try {
    debugResults = await api.send("debug_traceBlockByNumber", [
      rpcBlockTag,
      { tracer: "callTracer" },
    ]);
  } catch (error) {
    const exception = (): Error =>
      new UnsupportedRpcMethodError(
        "debug_traceBlockByNumber is not supported by this RPC provider",
        {
          method: "debug_traceBlockByNumber",
          rawError: error,
        },
      );
    if (isUnsupportedRpcMethodError(error) || isUnsupportedRpcMethodErrorMsg(error)) {
      throw exception();
    }
    throw error;
  }

  if (!Array.isArray(debugResults)) throw new Error("Invalid debug_traceBlockByNumber response");

  const items = gethCallTracerToTraceBlockItems(blockHeight, debugResults);

  return items;
}

async function traceBlockErigon(
  api: JsonRpcProvider,
  blockHeight: number | "latest",
): Promise<TraceBlockItem[]> {
  const blockTag = blockHeight === "latest" ? "latest" : ethers.toQuantity(blockHeight);
  return await api.send("trace_block", [blockTag]);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

async function callTraceBlock(
  api: JsonRpcProvider,
  blockHeight: number | "latest",
): Promise<TraceBlockItem[]> {
  return await traceBlockErigon(api, blockHeight).catch(error => {
    if (isUnsupportedRpcMethodError(error) && isNumber(blockHeight)) {
      return traceBlockGeth(api, blockHeight);
    }
    throw error;
  });
}

async function traceBlock(
  api: JsonRpcProvider,
  _currency: CryptoCurrency,
  blockHeight: number | "latest",
): Promise<TraceBlockItem[]> {
  const traces = await callTraceBlock(api, blockHeight);
  if (!Array.isArray(traces)) throw new Error("Invalid trace_block response");

  return traces.map((trace, index) => {
    if (!isTraceBlockItem(trace)) {
      throw new Error(`Malformed trace_block response at index ${index} ${JSON.stringify(trace)}`);
    }
    return trace;
  });
}

function isPrefetchedBlockTransaction(value: unknown): value is PrefetchedBlockTransaction {
  return (
    typeof value === "object" &&
    value !== null &&
    "hash" in value &&
    "value" in value &&
    "from" in value &&
    ("to" in value
      ? typeof value.to === "string" || value.to === null || value.to === undefined
      : true) &&
    typeof value.hash === "string" &&
    (typeof value.value === "string" || typeof value.value === "bigint") &&
    typeof value.from === "string"
  );
}

function getPrefetchedBlockTransactions(block: ethers.Block): unknown[] | undefined {
  try {
    return block.prefetchedTransactions;
  } catch (error) {
    // Ethers throws UNSUPPORTED_OPERATION when the block payload does not include tx objects.
    if (hasErrorCode(error, "UNSUPPORTED_OPERATION")) {
      return undefined;
    }
    throw error;
  }
}

function isTransactionReceipt(value: unknown): value is TransactionReceipt {
  return (
    typeof value === "object" &&
    value !== null &&
    "transactionHash" in value &&
    "gasUsed" in value &&
    "status" in value &&
    "logs" in value &&
    typeof value.transactionHash === "string" &&
    typeof value.gasUsed === "string" &&
    Array.isArray(value.logs)
  );
}

async function getOptimismAdditionalFees(
  api: JsonRpcProvider,
  currency: CryptoCurrency,
  transaction: string,
): Promise<BigNumber> {
  if (
    !["optimism", "optimism_sepolia", "base", "base_sepolia", "blast", "blast_sepolia"].includes(
      currency.id,
    )
  ) {
    return new BigNumber(0);
  }

  if (!transaction) {
    return new BigNumber(0);
  }

  const optimismGasOracle = new ethers.Contract(
    // contract address provided here
    // @see https://community.optimism.io/docs/developers/build/transaction-fees/#displaying-fees-to-users
    "0x420000000000000000000000000000000000000F",
    OptimismGasPriceOracleAbi,
    api,
  );
  const additionalL1Fees = await optimismGasOracle.getL1Fee(transaction);
  return new BigNumber(additionalL1Fees.toString());
}

async function getScrollAdditionalFees(
  api: JsonRpcProvider,
  currency: CryptoCurrency,
  transaction: string,
): Promise<BigNumber> {
  if (!["scroll", "scroll_sepolia"].includes(currency.id)) {
    return new BigNumber(0);
  }

  if (!transaction) {
    return new BigNumber(0);
  }

  const scrollGasOracle = new ethers.Contract(
    // contract address provided here
    // @see https://docs.scroll.io/en/developers/transaction-fees-on-scroll/#estimating-the-l1-data-fee
    "0x5300000000000000000000000000000000000002",
    ScrollGasPriceOracleAbi,
    api,
  );
  const additionalL1Fees = await scrollGasOracle.getL1Fee(transaction);
  return new BigNumber(additionalL1Fees.toString());
}

/* Get default maxPriorityFeePerGas by chain */
const getMaxPriorityFeePerGas = (currency: CryptoCurrency): BigNumber => {
  switch (currency.id) {
    case "zero_gravity":
      return new BigNumber(2e9); // 2 Gwei
    default:
      return new BigNumber(1e9); // 1 Gwei
  }
};

function cacheKeyOptimismL1Fees(
  currency: CryptoCurrency,
  transaction: Parameters<NodeApi["getOptimismAdditionalFees"]>[1],
): string {
  return "getOptimismL1BaseFee_" + currency.id + "_" + transaction;
}

function make<F extends (currency: CryptoCurrency, ...args: any[]) => any>(
  f: (api: JsonRpcProvider, ...args: Parameters<F>) => ReturnType<F>,
  nodeConfig: ExternalNodeConfig,
  configOverride: Partial<ExternalNodeConfig> = {},
): F {
  const mergedConfig = { ...nodeConfig, ...configOverride };
  return ((...args: Parameters<F>) => {
    const [currency] = args;
    return withApi(currency, api => f(api, ...args), mergedConfig);
  }) as F;
}

export function createNodeApi(config: ExternalNodeConfig): NodeApi {
  return {
    getBlockByHeight: make(getBlockByHeight, config),
    getCoinBalance: make(getCoinBalance, config),
    getTokenBalance: make(getTokenBalance, config),
    getTransactionCount: make(getTransactionCount, config),
    getTransaction: make(getTransaction, config),
    getBlockReceipts: make(getBlockReceipts, config),
    traceBlock: make(traceBlock, config),
    getGasEstimation: makeGetGasEstimation(config),
    getFeeData: make(getFeeData, config),
    broadcastTransaction: make(broadcastTransaction, config, { retries: 0 }),
    getOptimismAdditionalFees: makeLRUCache(
      make(getOptimismAdditionalFees, config),
      cacheKeyOptimismL1Fees,
      { ttl: 15 * 1000 }, // prevent rate limit by caching for at least 15s
    ),
    getScrollAdditionalFees: make(getScrollAdditionalFees, config),
  };
}

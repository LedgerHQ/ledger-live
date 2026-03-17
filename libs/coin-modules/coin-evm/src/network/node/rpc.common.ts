/** ⚠️ keep this order of import. @see https://docs.ethers.io/v5/cookbook/react-native/#cookbook-reactnative ⚠️ */
import { getEnv } from "@ledgerhq/live-env";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { delay } from "@ledgerhq/live-promise";
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
import { hasErrorCode, isUnsupportedRpcMethodError } from "./rpc.errors";
import {
  NodeApi,
  ERC20Transfer,
  PrefetchedBlockTransaction,
  LogWithAddress,
  TransactionReceipt,
  TraceBlockItem,
  TransactionInfo,
  BlockByHeightResult,
  BlockReceiptInfo,
  isTraceBlockCallAction,
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
  nodeConfig: ExternalNodeConfig,
): Promise<T> {
  const retries = nodeConfig.retries ?? DEFAULT_RETRIES_RPC_METHODS;
  try {
    if (!PROVIDERS_BY_RPC[currency.id]) {
      const chainId = currency.ethereumLikeInfo?.chainId;
      PROVIDERS_BY_RPC[currency.id] = new JsonRpcProvider(nodeConfig.uri, chainId);
    }

    const provider = PROVIDERS_BY_RPC[currency.id];
    return await execute(provider);
  } catch (e) {
    if (retries) {
      // wait the RPC timeout before trying again
      await delay(RPC_TIMEOUT);
      return withApi<T>(currency, execute, { ...nodeConfig, retries: retries - 1 });
    }
    throw e;
  }
}

async function getTransaction(
  api: JsonRpcProvider,
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

function makeGetTransaction(nodeConfig: ExternalNodeConfig): NodeApi["getTransaction"] {
  return (currency, txHash) => withApi(currency, api => getTransaction(api, txHash), nodeConfig);
}

async function getCoinBalance(
  api: JsonRpcProvider,
  address: string,
): Promise<BigNumber> {
  const balance = await api.getBalance(normalizeAddress(address));
  return new BigNumber(balance.toString());
}

function makeGetCoinBalance(nodeConfig: ExternalNodeConfig): NodeApi["getCoinBalance"] {
  return (currency, address) => withApi(currency, api => getCoinBalance(api, address), nodeConfig);
}
async function getTokenBalance(
  api: JsonRpcProvider,
  address: string,
  contractAddress: string,
): Promise<BigNumber> {
  const erc20 = new ethers.Contract(normalizeAddress(contractAddress), ERC20Abi, api);
  const balance = await erc20.balanceOf(normalizeAddress(address));
  return new BigNumber(balance.toString());
}

function makeGetTokenBalance(nodeConfig: ExternalNodeConfig): NodeApi["getTokenBalance"] {
  return (currency, address, contractAddress) =>
    withApi(currency, api => getTokenBalance(api, address, contractAddress), nodeConfig);
}
async function getTransactionCount(
  api: JsonRpcProvider,
  address: string,
): Promise<number> {
  return api.getTransactionCount(normalizeAddress(address), "pending");
}

function makeGetTransactionCount(nodeConfig: ExternalNodeConfig): NodeApi["getTransactionCount"] {
  return (currency, address) =>
    withApi(currency, api => getTransactionCount(api, address), nodeConfig);
}

async function getGasEstimation(
  api: JsonRpcProvider,
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
    withApi(account.currency, api => getGasEstimation(api, account, transaction), {
      ...nodeConfig,
      retries: 0,
    });
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

function makeGetFeeData(nodeConfig: ExternalNodeConfig): NodeApi["getFeeData"] {
  return (currency, transaction) =>
    withApi(currency, api => getFeeData(api, currency, transaction), nodeConfig);
}

async function broadcastTransaction(
  api: JsonRpcProvider,
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

function makeBroadcastTransaction(nodeConfig: ExternalNodeConfig): NodeApi["broadcastTransaction"] {
  return (currency, signedTxHex) =>
    withApi(currency, api => broadcastTransaction(api, signedTxHex), {
      ...nodeConfig,
      retries: 0,
    });
}

async function getBlockByHeight(
  api: JsonRpcProvider,
  blockHeight: number | "latest",
  prefetchTxs: boolean,
): Promise<BlockByHeightResult> {
  const block = await api.getBlock(blockHeight, prefetchTxs);

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

function makeGetBlockByHeight(nodeConfig: ExternalNodeConfig): NodeApi["getBlockByHeight"] {
  return (currency, blockHeight = "latest", prefetchTxs = false) =>
    withApi(currency, api => getBlockByHeight(api, blockHeight, prefetchTxs), nodeConfig);
}

async function getBlockReceipts(
  api: JsonRpcProvider,
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

function makeGetBlockReceipts(
  nodeConfig: ExternalNodeConfig,
): Exclude<NodeApi["getBlockReceipts"], undefined> {
  return (currency, blockHeight = "latest") =>
    withApi(currency, api => getBlockReceipts(api, blockHeight), nodeConfig);
}

async function traceBlock(
  api: JsonRpcProvider,
  blockHeight: number | "latest",
): Promise<TraceBlockItem[]> {
  const blockTag = blockHeight === "latest" ? "latest" : ethers.toQuantity(blockHeight);
  let traces: unknown;
  try {
    traces = await api.send("trace_block", [blockTag]);
  } catch (error) {
    if (isUnsupportedRpcMethodError(error)) {
      throw new UnsupportedRpcMethodError("trace_block is not supported by this RPC provider", {
        method: "trace_block",
        rawError: error,
      });
    }
    throw error;
  }

  if (!Array.isArray(traces)) throw new Error("Invalid trace_block response");

  return traces.map((trace, index) => {
    if (!isTraceBlockItem(trace)) {
      throw new Error(`Malformed trace_block response at index ${index} ${JSON.stringify(trace)}`);
    }
    return trace;
  });
}

function makeTraceBlock(nodeConfig: ExternalNodeConfig): NonNullable<NodeApi["traceBlock"]> {
  return (currency, blockHeight = "latest") =>
    withApi(currency, api => traceBlock(api, blockHeight), nodeConfig);
}

function isTraceBlockItem(value: unknown): value is TraceBlockItem {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  if (!o.action || typeof o.action !== "object" || o.action === null) return false;
  const action = o.action as Record<string, unknown>;
  if (o.error !== undefined && typeof o.error !== "string") return false;

  const result = o.result;
  const resultOk =
    result === undefined ||
    result === null ||
    (typeof result === "object" &&
      ((result as Record<string, unknown>).error === undefined ||
        typeof (result as Record<string, unknown>).error === "string"));
  const validCall = typeof o.transactionHash === "string" && resultOk;

  return !isTraceBlockCallAction(action) || validCall;
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
    typeof value.value === "bigint" &&
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

function makeGetOptimismAdditionalFees(
  nodeConfig: ExternalNodeConfig,
): NodeApi["getOptimismAdditionalFees"] {
  return async (currency, transaction) =>
    withApi(currency, api => getOptimismAdditionalFees(api, currency, transaction), nodeConfig);
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

function makeGetScrollAdditionalFees(
  nodeConfig: ExternalNodeConfig,
): NodeApi["getScrollAdditionalFees"] {
  return (currency, transaction) =>
    withApi(currency, api => getScrollAdditionalFees(api, currency, transaction), nodeConfig);
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

export function createNodeApi(config: ExternalNodeConfig): NodeApi {
  const getOptimismAdditionalFeesUncached = makeGetOptimismAdditionalFees(config);
  return {
    getBlockByHeight: makeGetBlockByHeight(config),
    getCoinBalance: makeGetCoinBalance(config),
    getTokenBalance: makeGetTokenBalance(config),
    getTransactionCount: makeGetTransactionCount(config),
    getTransaction: makeGetTransaction(config),
    getBlockReceipts: makeGetBlockReceipts(config),
    traceBlock: makeTraceBlock(config),
    getGasEstimation: makeGetGasEstimation(config),
    getFeeData: makeGetFeeData(config),
    broadcastTransaction: makeBroadcastTransaction(config),
    getOptimismAdditionalFees: makeLRUCache(
      getOptimismAdditionalFeesUncached,
      cacheKeyOptimismL1Fees,
      {
        ttl: 15 * 1000, // prevent rate limit by caching for at least 15s
      },
    ),
    getScrollAdditionalFees: makeGetScrollAdditionalFees(config),
  };
}

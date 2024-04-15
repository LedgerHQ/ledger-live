import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";
import { delay } from "@ledgerhq/live-promise";
import axios, { AxiosRequestConfig } from "axios";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Batcher } from "@ledgerhq/coin-framework/batcher/types";
import { makeBatcher } from "@ledgerhq/coin-framework/batcher/index";
import { GasEstimationError, LedgerNodeUsedIncorrectly } from "../../errors";
import OptimismGasPriceOracleAbi from "../../abis/optimismGasPriceOracle.abi.json";
import { getSerializedTransaction } from "../../transaction";
import { LedgerExplorerOperation } from "../../types";
import { getCoinConfig } from "../../config";
import { getGasOptions } from "../gasTracker/ledger";
import { padHexString } from "../../logic";
import { NodeApi, isLedgerNodeConfig } from "./types";

export const LEDGER_TIMEOUT = 10_000; // 10_000ms (10s) for network call timeout
export const LEDGER_TIME_BETWEEN_TRIES = 200; // 200ms between 2 calls
export const DEFAULT_RETRIES_API = 2;

export async function fetchWithRetries<T>(
  params: AxiosRequestConfig,
  retries = DEFAULT_RETRIES_API,
): Promise<T> {
  try {
    const { data } = await axios.request<T>({
      ...params,
      headers: {
        ...(params.headers || {}),
        "X-Ledger-Client-Version": getEnv("LEDGER_CLIENT_VERSION"),
      },
    });

    return data;
  } catch (e) {
    if (retries) {
      // wait the API timeout before trying again
      await delay(LEDGER_TIME_BETWEEN_TRIES);
      // decrement with prefix here or it won't work
      return fetchWithRetries<T>(params, --retries);
    }
    throw e;
  }
}

// Map of request batcher by Currency
const tokenBalancesBatchersMap = new Map<
  CryptoCurrency,
  Batcher<
    {
      address: string;
      contract: string;
    },
    BigNumber
  >
>();

/**
 * Get a transaction by hash
 */
export const getTransaction: NodeApi["getTransaction"] = async (currency, hash) => {
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const ledgerTransaction = await fetchWithRetries<LedgerExplorerOperation>({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/tx/${hash}`,
  });

  return {
    hash: ledgerTransaction.hash,
    blockHeight: ledgerTransaction.block.height,
    blockHash: ledgerTransaction.block.hash,
    nonce: ledgerTransaction.nonce_value,
  };
};

/**
 * Get the balance of an address
 */
export const getCoinBalance: NodeApi["getCoinBalance"] = async (currency, address) => {
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { balance } = await fetchWithRetries<{ address: string; balance: string }>({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/address/${address}/balance`,
  });

  return new BigNumber(balance);
};

/**
 * Get the balance of multiples tokens for addresses
 */
export const getBatchTokenBalances = async (
  input: { address: string; contract: string }[],
  params: { currency: CryptoCurrency },
): Promise<BigNumber[]> => {
  const { currency } = params;
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const balances = await fetchWithRetries<
    Array<{
      address: string;
      contract: string;
      balance: string;
    }>
  >({
    method: "POST",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/erc20/balances`,
    data: input,
  });

  return balances.map(({ balance }) => new BigNumber(balance));
};

/**
 * Get the balance of an address for an ERC20 token
 */
export const getTokenBalance: NodeApi["getTokenBalance"] = async (
  currency,
  address,
  contractAddress,
) => {
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  if (!tokenBalancesBatchersMap.has(currency)) {
    const batcher = makeBatcher(getBatchTokenBalances, { currency });
    tokenBalancesBatchersMap.set(currency, batcher);
  }
  const requestBatcher = tokenBalancesBatchersMap.get(currency)!;

  return requestBatcher({ address, contract: contractAddress });
};

/**
 * Get account nonce
 */
export const getTransactionCount: NodeApi["getTransactionCount"] = async (currency, address) => {
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { nonce } = await fetchWithRetries<{
    address: string;
    nonce: number;
  }>({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/address/${address}/nonce`,
  });

  return nonce;
};

/**
 * Get an estimated gas limit for a transaction
 */
export const getGasEstimation: NodeApi["getGasEstimation"] = async (
  account,
  transaction,
): Promise<BigNumber> => {
  const { currency } = account;
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { recipient: to, amount: value, data } = transaction;

  try {
    const { estimated_gas_limit: gasEstimation } = await fetchWithRetries<{
      to: string;
      estimated_gas_limit: string;
    }>({
      method: "POST",
      timeout: LEDGER_TIMEOUT,
      url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/tx/estimate-gas-limit`,
      data: {
        from: account.freshAddress, // should be necessary for some estimations
        to,
        value: "0x" + (padHexString(value.toString(16)) || "00"),
        data: data ? `0x${padHexString(data.toString("hex"))}` : "0x",
      },
    });

    return new BigNumber(gasEstimation);
  } catch (e) {
    log("error", "EVM Family: Gas Estimation Error", e);
    throw new GasEstimationError();
  }
};

/**
 * Get an estimation of fees on the network
 *
 * ⚠️ Since the explorers are not able to provide the expected
 * RPC endpoints (eth_gasPrice/eth_feeHistory) as REST api,
 * we're forcing the use of the explorers Gas Tracker
 * rather than the status returned by the node
 * regarding the network status
 */
export const getFeeData: NodeApi["getFeeData"] = async (currency, transaction) => {
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { medium } = await getGasOptions({
    currency: {
      ...currency,
      ethereumLikeInfo: {
        ...currency.ethereumLikeInfo!,
      },
    },
    /**
     * ⚠️ We don't know the type of the transaction for sure at this stage since
     * `getFeeData` is called before `getTypedTransaction` in prepareTransaction
     * libs/coin-evm/src/prepareTransaction.ts:201
     * It's most probably always 2 since it's the default type value for a new transaction
     * cf. libs/coin-evm/src/createTransaction.ts:23
     */
    options: {
      useEIP1559: transaction.type === 2,
      overrideGasTracker: { type: "ledger", explorerId: node.explorerId },
    },
  });

  return medium;
};

/**
 * Broadcast a serialized transaction and returns its hash
 */
export const broadcastTransaction: NodeApi["broadcastTransaction"] = async (
  currency,
  signedTxHex,
) => {
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { result: hash } = await fetchWithRetries<{
    result: string;
  }>({
    method: "POST",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/tx/send`,
    data: { tx: signedTxHex },
  });

  return hash;
};

/**
 * Get the informations about a block by block height
 */
export const getBlockByHeight: NodeApi["getBlockByHeight"] = async (
  currency,
  blockHeight = "latest",
) => {
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  if (blockHeight === "latest") {
    const { hash, height, time } = await fetchWithRetries<{
      hash: string;
      height: number;
      time: string;
      txs: string[];
    }>({
      method: "GET",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/block/current`,
    });

    return { hash, height, timestamp: new Date(time).getTime() };
  }

  /**
   * for some reason, this explorer endpoint doesn't return the block object
   * but an array of one element with the requested block
   */
  const [{ hash, height, time }] = await fetchWithRetries<
    [
      {
        hash: string;
        height: number;
        time: string;
        txs: string[];
      },
    ]
  >({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/block/${blockHeight}`,
  });

  return {
    hash,
    height,
    timestamp: new Date(time).getTime(),
  };
};

/**
 * ⚠️ Blockchain specific
 *
 * For a layer 2 like Optimism, additional fees are needed in order to
 * take into account layer 1 settlement estimated cost.
 * This gas price is served through a smart contract oracle.
 *
 * @see https://help.optimism.io/hc/en-us/articles/4411895794715-How-do-transaction-fees-on-Optimism-work-
 */
//
export const getOptimismAdditionalFees: NodeApi["getOptimismAdditionalFees"] = async (
  currency,
  transaction,
) => {
  const config = getCoinConfig(currency).info;
  const { node } = config || /* istanbul ignore next */ {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  if (!["optimism", "optimism_goerli"].includes(currency.id)) {
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
    } catch (e) {
      return null;
    }
  })();
  if (!serializedTransaction) {
    return new BigNumber(0);
  }

  const optimismGasOracle = new ethers.utils.Interface(OptimismGasPriceOracleAbi);
  const data = optimismGasOracle.encodeFunctionData("getL1Fee(bytes)", [serializedTransaction]);

  const [result] = await fetchWithRetries<
    Array<{
      info: {
        contract: string;
        data: string;
        blockNumber: number | null;
      };
      response: string;
    }>
  >({
    method: "POST",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/contract/read`,
    data: [
      {
        // @see https://community.optimism.io/docs/developers/build/transaction-fees/#displaying-fees-to-users
        contract: "0x420000000000000000000000000000000000000F",
        data,
      },
    ],
  });

  return new BigNumber(result.response);
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
};

export default node;

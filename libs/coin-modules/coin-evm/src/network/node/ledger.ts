import { getEnv } from "@ledgerhq/live-env";
import { makeBatcher } from "@ledgerhq/live-network/batcher/index";
import { Batcher } from "@ledgerhq/live-network/batcher/types";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import axios, { AxiosRequestConfig } from "axios";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import OptimismGasPriceOracleAbi from "../../abis/optimismGasPriceOracle.abi.json";
import { LedgerNodeConfig } from "../../config";
import { GasEstimationError } from "../../errors";
import { LedgerExplorerOperation } from "../../types";
import { padHexString, safeEncodeEIP55 } from "../../utils";
import { getGasOptions } from "../gasTracker/ledger";
import { withRetries } from "../withRetries";
import { NodeApi } from "./types";

const LEDGER_TIMEOUT = 10_000; // 10s for network call timeout
const LEDGER_TIME_BETWEEN_TRIES = 200; // 200ms between 2 calls
const DEFAULT_RETRIES_API = 2;

type LedgerFetch = <T>(params: AxiosRequestConfig) => Promise<T>;

function makeFetchWithRetries(config: LedgerNodeConfig): LedgerFetch {
  const retries = config.retries ?? DEFAULT_RETRIES_API;
  return async function fetchWithRetries<T>(params: AxiosRequestConfig): Promise<T> {
    return withRetries(
      async () => {
        const { data } = await axios.request<T>({
          ...params,
          headers: {
            ...(params.headers || {}),
            "X-Ledger-Client-Version": getEnv("LEDGER_CLIENT_VERSION"),
          },
        });
        return data;
      },
      retries,
      LEDGER_TIME_BETWEEN_TRIES,
    );
  };
}

function makeGetTokenBalance(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
  tokenBalancesBatchersMap: Map<
    CryptoCurrency,
    Batcher<
      {
        address: string;
        contract: string;
      },
      BigNumber
    >
  >,
): NodeApi["getTokenBalance"] {
  return async (currency, address, contractAddress) => {
    if (!tokenBalancesBatchersMap.has(currency)) {
      const batcher = makeBatcher(makeGetBatchTokenBalances(config, fetch), { currency });
      tokenBalancesBatchersMap.set(currency, batcher);
    }
    const requestBatcher = tokenBalancesBatchersMap.get(currency)!;
    return requestBatcher({ address, contract: contractAddress });
  };
}

function makeGetTransaction(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
): NodeApi["getTransaction"] {
  return async (_currency, hash) => {
    const ledgerTransaction = await fetch<LedgerExplorerOperation>({
      method: "GET",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/tx/${hash}`,
    });

    return {
      hash: ledgerTransaction.hash,
      blockHeight: ledgerTransaction.block.height,
      blockHash: ledgerTransaction.block.hash,
      nonce: ledgerTransaction.nonce_value,
      gasPrice: ledgerTransaction.gas_price,
      gasUsed: ledgerTransaction.gas_used,
      value: ledgerTransaction.value,
      status: ledgerTransaction.status,
      from: ledgerTransaction.from,
      to: ledgerTransaction.to,
      erc20Transfers: ledgerTransaction.transfer_events.map(event => ({
        asset: {
          type: "erc20" as const,
          assetReference: safeEncodeEIP55(event.contract),
        },
        from: safeEncodeEIP55(event.from),
        to: safeEncodeEIP55(event.to),
        value: event.count,
      })),
    };
  };
}

function makeGetCoinBalance(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
): NodeApi["getCoinBalance"] {
  return async (_currency, address) => {
    const { balance } = await fetch<{ address: string; balance: string }>({
      method: "GET",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/address/${address}/balance`,
    });
    return new BigNumber(balance);
  };
}

function makeGetBatchTokenBalances(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
): (
  input: { address: string; contract: string }[],
  params: { currency: CryptoCurrency },
) => Promise<BigNumber[]> {
  return async (input, _params) => {
    const balances = await fetch<
      Array<{
        address: string;
        contract: string;
        balance: string;
      }>
    >({
      method: "POST",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/erc20/balances`,
      data: input,
    });
    return balances.map(({ balance }) => new BigNumber(balance));
  };
}

function makeGetTransactionCount(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
): NodeApi["getTransactionCount"] {
  return async (_currency, address) => {
    const { nonce } = await fetch<{
      address: string;
      nonce: number;
    }>({
      method: "GET",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/address/${address}/nonce`,
    });
    return nonce;
  };
}

function makeGetGasEstimation(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
): NodeApi["getGasEstimation"] {
  return async (account, transaction) => {
    const { recipient: to, amount: value, data } = transaction;
    try {
      const { estimated_gas_limit: gasEstimation } = await fetch<{
        to: string;
        estimated_gas_limit: string;
      }>({
        method: "POST",
        timeout: LEDGER_TIMEOUT,
        url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/tx/estimate-gas-limit`,
        data: {
          from: account.freshAddress,
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
}

function makeGetFeeData(config: LedgerNodeConfig): NodeApi["getFeeData"] {
  return async (currency, transaction) => {
    const options = await getGasOptions({
      currency: {
        ...currency,
        ethereumLikeInfo: {
          ...currency.ethereumLikeInfo!,
        },
      },
      options: {
        useEIP1559: getEnv("EVM_FORCE_LEGACY_TRANSACTIONS") ? false : transaction.type === 2,
        overrideGasTracker: { type: "ledger", explorerId: config.explorerId },
      },
    });
    return options?.[transaction.feesStrategy as keyof typeof options] ?? options.medium;
  };
}

function makeBroadcastTransaction(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
): NodeApi["broadcastTransaction"] {
  return async (_currency, signedTxHex, broadcastConfig) => {
    const params: Record<string, boolean> = {
      mevProtected: Boolean(broadcastConfig?.mevProtected),
      sponsored: Boolean(broadcastConfig?.sponsored),
    };
    const headers: Record<string, string> = {};
    if (broadcastConfig?.source) {
      headers["X-Ledger-Source-Type"] = broadcastConfig.source.type;
      headers["X-Ledger-Source-Name"] = broadcastConfig.source.name;
    }
    const { result: hash } = await fetch<{ result: string }>({
      method: "POST",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/tx/send`,
      data: { tx: signedTxHex },
      params,
      headers,
    });
    return hash;
  };
}

function makeGetBlockByHeight(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
): NodeApi["getBlockByHeight"] {
  return async (_currency, blockHeight = "latest", _prefetchTxs = false) => {
    if (blockHeight === "latest") {
      const { hash, height, time, txs, prevHash } = await fetch<{
        hash: string;
        height: number;
        time: string;
        txs: string[];
        prevHash?: string;
      }>({
        method: "GET",
        url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/block/current`,
      });
      return {
        hash,
        height,
        timestamp: new Date(time).getTime(),
        parentHash: prevHash || "",
        transactionHashes: txs,
      };
    }
    const [{ hash, height, time, txs, prevHash }] = await fetch<
      [
        {
          hash: string;
          height: number;
          time: string;
          txs: string[];
          prevHash?: string;
        },
      ]
    >({
      method: "GET",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/block/${blockHeight}`,
    });
    return {
      hash,
      height,
      timestamp: new Date(time).getTime(),
      parentHash: prevHash || "",
      transactionHashes: txs,
    };
  };
}

function makeGetOptimismAdditionalFees(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
): NodeApi["getOptimismAdditionalFees"] {
  return async (currency, transaction) => {
    if (!["optimism", "optimism_sepolia"].includes(currency.id)) {
      return new BigNumber(0);
    }
    if (!transaction) {
      return new BigNumber(0);
    }
    const optimismGasOracle = new ethers.Interface(OptimismGasPriceOracleAbi);
    const data = optimismGasOracle.encodeFunctionData("getL1Fee(bytes)", [transaction]);
    const [result] = await fetch<
      Array<{
        info: { contract: string; data: string; blockNumber: number | null };
        response: string;
      }>
    >({
      method: "POST",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/contract/read`,
      data: [
        {
          contract: "0x420000000000000000000000000000000000000F",
          data,
        },
      ],
    });
    return new BigNumber(result.response);
  };
}

function makeGetScrollAdditionalFees(
  config: LedgerNodeConfig,
  fetch: LedgerFetch,
): NodeApi["getScrollAdditionalFees"] {
  return async (currency, transaction) => {
    if (!["scroll", "scroll_sepolia"].includes(currency.id)) {
      return new BigNumber(0);
    }
    if (!transaction) {
      return new BigNumber(0);
    }
    const optimismGasOracle = new ethers.Interface(OptimismGasPriceOracleAbi);
    const data = optimismGasOracle.encodeFunctionData("getL1Fee(bytes)", [transaction]);
    const [result] = await fetch<
      Array<{
        info: { contract: string; data: string; blockNumber: number | null };
        response: string;
      }>
    >({
      method: "POST",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${config.explorerId}/contract/read`,
      data: [
        {
          contract: "0x5300000000000000000000000000000000000002",
          data,
        },
      ],
    });
    return new BigNumber(result.response);
  };
}

export function createLedgerNodeApi(config: LedgerNodeConfig): NodeApi {
  const fetch = makeFetchWithRetries(config);
  const tokenBalancesBatchersMap = new Map<
    CryptoCurrency,
    Batcher<{ address: string; contract: string }, BigNumber>
  >();
  return {
    getBlockByHeight: makeGetBlockByHeight(config, fetch),
    getCoinBalance: makeGetCoinBalance(config, fetch),
    getTokenBalance: makeGetTokenBalance(config, fetch, tokenBalancesBatchersMap),
    getTransactionCount: makeGetTransactionCount(config, fetch),
    getTransaction: makeGetTransaction(config, fetch),
    getGasEstimation: makeGetGasEstimation(config, fetch),
    getFeeData: makeGetFeeData(config),
    broadcastTransaction: makeBroadcastTransaction(config, fetch),
    getOptimismAdditionalFees: makeGetOptimismAdditionalFees(config, fetch),
    getScrollAdditionalFees: makeGetScrollAdditionalFees(config, fetch),
  };
}

import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { AccountIdentifier, HttpHandler, PublicKey, RpcClient, Transaction } from "casper-js-sdk";
import {
  CASPER_INDEXER_MAX_PAGE_SIZE,
  NodeErrorCodeAccountNotFound,
  NodeErrorCodeQueryFailed,
} from "../constants";
import type { CasperConfig } from "../types/config";
import { IndexerResponseRoot, ITxnHistoryData, RpcError } from "../types/network";

const getCasperIndexerURL = (config: CasperConfig, path: string): string => {
  const baseUrl = config.infra.API_CASPER_INDEXER;
  if (!baseUrl) throw new Error("API base URL not available");

  return new URL(path, baseUrl).toString();
};

const getCasperNodeURL = (config: CasperConfig): string => {
  const baseUrl = config.infra.API_CASPER_NODE_ENDPOINT;
  if (!baseUrl) throw new Error("API base URL not available");

  return baseUrl;
};

export const getCasperNodeRpcClient = (config: CasperConfig): RpcClient => {
  const url = getCasperNodeURL(config);
  const handler = new HttpHandler(url);
  return new RpcClient(handler);
};

const casperIndexerWrapper = async <T>(config: CasperConfig, path: string) => {
  const url = getCasperIndexerURL(config, path);

  try {
    const rawResponse = await network<IndexerResponseRoot<T>>({
      method: "GET",
      url,
    });
    log("http", url);

    const { data, status } = rawResponse;
    if (status >= 300) {
      log("http", url, data);
    }
    return data;
  } catch (error) {
    log("error", "Casper indexer error: ", error);
    throw error;
  }
};

export const fetchAccountStateInfo = async (
  config: CasperConfig,
  publicKey: string,
): Promise<{
  purseUref: string | undefined;
  accountHash: string | undefined;
}> => {
  const client = getCasperNodeRpcClient(config);
  try {
    const { account } = await client.getAccountInfo(
      null,
      new AccountIdentifier(undefined, PublicKey.fromHex(publicKey)),
    );

    const accountHash = account.accountHash.toHex();
    const purseURefString = account.mainPurse.toPrefixedString();

    return { purseUref: purseURefString, accountHash };
  } catch (error) {
    if (
      error instanceof Error &&
      [NodeErrorCodeAccountNotFound, NodeErrorCodeQueryFailed].includes(
        (error as RpcError).statusCode,
      )
    ) {
      return {
        purseUref: undefined,
        accountHash: undefined,
      };
    }
    throw error;
  }
};

export const fetchBalance = async (config: CasperConfig, purseUref: string): Promise<BigNumber> => {
  const client = getCasperNodeRpcClient(config);
  try {
    const { stateRootHash } = await client.getStateRootHashLatest();
    const balance = await client.getBalanceByStateRootHash(purseUref, stateRootHash.toHex());
    return new BigNumber(balance.balanceValue.toString());
  } catch (error) {
    log("error", "Failed to fetch balance", error);
    throw error;
  }
};

export const fetchLastBlock = async (
  config: CasperConfig,
): Promise<{ height: number; hash: string; time: Date }> => {
  const client = getCasperNodeRpcClient(config);
  try {
    const { block } = await client.getLatestBlock();
    return {
      height: block.height,
      hash: block.hash.toHex(),
      time: block.timestamp.date,
    };
  } catch (error) {
    log("error", "Failed to fetch last block", error);
    throw error;
  }
};

export const fetchChainspecToml = async (config: CasperConfig): Promise<string> => {
  const client = getCasperNodeRpcClient(config);
  try {
    const { chainspecBytes } = await client.getChainspec();
    const hex = chainspecBytes.chainspecBytes;
    if (!hex) throw new Error("Chainspec bytes missing from response");

    return Buffer.from(hex, "hex").toString("utf8");
  } catch (error) {
    log("error", "Failed to fetch chainspec", error);
    throw error;
  }
};

/**
 * Fetch one page of an account's deploy feed, newest first.
 *
 * Pages are 1-indexed — `page=0` is a 400, a page past the end is a 200 with an empty `data`.
 * Accounts with a very large feed are refused outright with a 403 `access_denied`.
 */
export const fetchTxsPage = async (
  config: CasperConfig,
  addr: string,
  page: number,
): Promise<IndexerResponseRoot<ITxnHistoryData>> =>
  casperIndexerWrapper<ITxnHistoryData>(
    config,
    `accounts/${addr}/ledgerlive-deploys?page=${page}&page_size=${CASPER_INDEXER_MAX_PAGE_SIZE}`,
  );

export const fetchTxs = async (config: CasperConfig, addr: string): Promise<ITxnHistoryData[]> => {
  const first = await fetchTxsPage(config, addr, 1);
  const txs = [...first.data];

  for (let page = 2; page <= first.page_count; page++) {
    txs.push(...(await fetchTxsPage(config, addr, page)).data);
  }
  return txs;
};

export const broadcastTx = async (
  config: CasperConfig,
  transaction: Transaction,
): Promise<string> => {
  const client = getCasperNodeRpcClient(config);
  try {
    const response = await client.putTransaction(transaction);
    return response.transactionHash.toHex();
  } catch (error) {
    log("error", "Failed to broadcast transaction", error);
    throw error;
  }
};

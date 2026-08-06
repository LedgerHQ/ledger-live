import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { AccountIdentifier, HttpHandler, PublicKey, RpcClient, Transaction } from "casper-js-sdk";
import { getCoinConfig } from "../config";
import { NodeErrorCodeAccountNotFound, NodeErrorCodeQueryFailed } from "../constants";
import { IndexerResponseRoot, ITxnHistoryData, RpcError } from "../types/network";

const getCasperIndexerURL = (path: string): string => {
  const baseUrl = getCoinConfig().infra.API_CASPER_INDEXER;
  if (!baseUrl) throw new Error("API base URL not available");

  return new URL(path, baseUrl).toString();
};

const getCasperNodeURL = (): string => {
  const baseUrl = getCoinConfig().infra.API_CASPER_NODE_ENDPOINT;
  if (!baseUrl) throw new Error("API base URL not available");

  return baseUrl;
};

export const getCasperNodeRpcClient = (): RpcClient => {
  const url = getCasperNodeURL();
  const handler = new HttpHandler(url);
  return new RpcClient(handler);
};

const casperIndexerWrapper = async <T>(path: string) => {
  const url = getCasperIndexerURL(path);

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
  publicKey: string,
): Promise<{
  purseUref: string | undefined;
  accountHash: string | undefined;
}> => {
  const client = getCasperNodeRpcClient();
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

export const fetchBalance = async (purseUref: string): Promise<BigNumber> => {
  const client = getCasperNodeRpcClient();
  try {
    const { stateRootHash } = await client.getStateRootHashLatest();
    const balance = await client.getBalanceByStateRootHash(purseUref, stateRootHash.toHex());
    return new BigNumber(balance.balanceValue.toString());
  } catch (error) {
    log("error", "Failed to fetch balance", error);
    throw error;
  }
};

export const fetchLastBlock = async (): Promise<{ height: number; hash: string; time: Date }> => {
  const client = getCasperNodeRpcClient();
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

/**
 * The indexer serves a fixed 10 records per page and ignores any `limit` query parameter.
 * Verified against mainnet: `limit=5` and `limit=100` both return 10 items for a 49-record account.
 */
export const CASPER_INDEXER_PAGE_SIZE = 10;

/**
 * Fetch a single page of an account's deploy history, newest first.
 *
 * Pages are 1-indexed — `page=0` is a 400. A page past the end is a 200 with an empty `data`.
 */
export const fetchTxsPage = async (
  addr: string,
  page: number,
): Promise<IndexerResponseRoot<ITxnHistoryData>> =>
  casperIndexerWrapper<ITxnHistoryData>(`accounts/${addr}/ledgerlive-deploys?page=${page}`);

export const fetchTxs = async (addr: string): Promise<ITxnHistoryData[]> => {
  let page = 1;
  let res: ITxnHistoryData[] = [];

  let response = await fetchTxsPage(addr, page);
  res = res.concat(response.data);

  while (response.page_count > page) {
    page++;
    response = await fetchTxsPage(addr, page);
    res = res.concat(response.data);
  }
  return res;
};

export const broadcastTx = async (transaction: Transaction): Promise<string> => {
  const client = getCasperNodeRpcClient();
  try {
    const response = await client.putTransaction(transaction);
    return response.transactionHash.toHex();
  } catch (error) {
    log("error", "Failed to broadcast transaction", error);
    throw error;
  }
};

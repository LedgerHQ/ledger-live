import BigNumber from "bignumber.js";
import { encodeFunctionData, erc20Abi } from "viem";
import network from "@ledgerhq/live-network";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { HEDERA_TRANSACTION_NAMES } from "../constants";
import { HederaAddAccountError } from "../errors";
import type {
  HederaMirrorAccountTokensResponse,
  HederaMirrorTransactionsResponse,
  HederaMirrorAccount,
  HederaMirrorAccountsResponse,
  HederaMirrorToken,
  HederaMirrorTransaction,
  HederaMirrorNetworkFees,
  HederaMirrorContractCallResult,
  HederaMirrorContractCallEstimate,
  HederaMirrorNode,
  HederaMirrorNodesResponse,
} from "../types";

const API_URL = getEnv("API_HEDERA_MIRROR");

async function getAccountsForPublicKey(publicKey: string): Promise<HederaMirrorAccount[]> {
  let res;
  try {
    res = await network<HederaMirrorAccountsResponse>({
      method: "GET",
      url: `${API_URL}/api/v1/accounts?account.publicKey=${publicKey}&balance=true&limit=100`,
    });
  } catch (e: unknown) {
    if (e instanceof LedgerAPI4xx) return [];
    throw e;
  }

  const accounts = res.data.accounts;

  return accounts;
}

/**
 * Fetches account information from the Hedera Mirror Node API, excluding transactions.
 *
 * @param address - The Hedera account ID (e.g., "0.0.12345")
 * @param timestamp - Optional timestamp filter to get historical account state.
 *                    Supports comparison operators:
 *                    - "lt:1234567890.123456789" - state before the timestamp
 *                    - "eq:1234567890.123456789" - state at the timestamp
 *                    Used primarily for analyzing state changes in staking operations.
 * @returns Promise resolving to account data
 * @throws HederaAddAccountError if account not found (404)
 */
async function getAccount(address: string, timestamp?: string): Promise<HederaMirrorAccount> {
  try {
    const params = new URLSearchParams({
      transactions: "false",
      ...(timestamp && { timestamp }),
    });

    const res = await network<HederaMirrorAccount>({
      method: "GET",
      url: `${API_URL}/api/v1/accounts/${address}?${params.toString()}`,
    });
    const account = res.data;

    return account;
  } catch (error) {
    if (error instanceof LedgerAPI4xx && "status" in error && error.status === 404) {
      throw new HederaAddAccountError();
    }

    throw error;
  }
}

// keeps old behavior when all pages are fetched
const getPaginationDirection = (fetchAllPages: boolean, order: string) => {
  if (fetchAllPages) return "gt";
  return order === "asc" ? "gt" : "lt";
};

async function getAccountTransactions({
  address,
  pagingToken,
  limit = 100,
  order = "desc",
  fetchAllPages,
}: {
  address: string;
  pagingToken: string | null;
  limit?: number | undefined;
  order?: "asc" | "desc" | undefined;
  fetchAllPages: boolean;
}): Promise<{ transactions: HederaMirrorTransaction[]; nextCursor: string | null }> {
  const transactions: HederaMirrorTransaction[] = [];
  const params = new URLSearchParams({
    "account.id": address,
    limit: limit.toString(),
    order,
  });

  if (pagingToken) {
    params.append("timestamp", `${getPaginationDirection(fetchAllPages, order)}:${pagingToken}`);
  }

  let nextCursor: string | null = null;
  let nextPath: string | null = `/api/v1/transactions?${params.toString()}`;

  // WARNING: don't break the loop when `transactions` array is empty but `links.next` is present
  // the mirror node API enforces a 60-day max time range per query, even if `timestamp` param is set
  // see: https://hedera.com/blog/changes-to-the-hedera-operated-mirror-node
  while (nextPath) {
    const res: LiveNetworkResponse<HederaMirrorTransactionsResponse> = await network({
      method: "GET",
      url: `${API_URL}${nextPath}`,
    });
    const newTransactions = res.data.transactions;
    transactions.push(...newTransactions);
    nextPath = res.data.links.next;

    // stop fetching if pagination mode is used and we reached the limit
    if (!fetchAllPages && transactions.length >= limit) {
      break;
    }
  }

  // ensure we don't exceed the limit in pagination mode
  if (!fetchAllPages && transactions.length > limit) {
    transactions.splice(limit);
  }

  // set the next cursor only if we have more transactions to fetch
  if (!fetchAllPages && nextPath) {
    const lastTx = transactions.at(-1);
    nextCursor = lastTx?.consensus_timestamp ?? null;
  }

  return { transactions, nextCursor };
}

async function getAccountTokens(address: string): Promise<HederaMirrorToken[]> {
  const tokens: HederaMirrorToken[] = [];
  const params = new URLSearchParams({
    limit: "100",
  });

  let nextPath: string | null = `/api/v1/accounts/${address}/tokens?${params.toString()}`;

  while (nextPath) {
    const res: LiveNetworkResponse<HederaMirrorAccountTokensResponse> = await network({
      method: "GET",
      url: `${API_URL}${nextPath}`,
    });
    const newTokens = res.data.tokens;
    tokens.push(...newTokens);
    nextPath = res.data.links.next;
  }

  return tokens;
}

async function getLatestTransaction(before: Date): Promise<HederaMirrorTransaction> {
  const params = new URLSearchParams({
    limit: "1",
    order: "desc",
    timestamp: `lt:${before.getTime() / 1000}`,
  });

  const res = await network<HederaMirrorTransactionsResponse>({
    method: "GET",
    url: `${API_URL}/api/v1/transactions?${params.toString()}`,
  });
  const transaction = res.data.transactions[0];

  if (!transaction) {
    throw new Error("No transactions found on the Hedera network");
  }

  return transaction;
}

async function getNetworkFees(): Promise<HederaMirrorNetworkFees> {
  const res = await network<HederaMirrorNetworkFees>({
    method: "GET",
    url: `${API_URL}/api/v1/network/fees`,
  });

  return res.data;
}

async function getContractCallResult(
  transactionHash: string,
): Promise<HederaMirrorContractCallResult> {
  const res = await network<HederaMirrorContractCallResult>({
    method: "GET",
    url: `${API_URL}/api/v1/contracts/results/${transactionHash}`,
  });

  return res.data;
}

async function findTransactionByContractCall({
  timestamp,
  payerAddress,
}: {
  timestamp: string;
  payerAddress: string;
}): Promise<HederaMirrorTransaction | null> {
  // TODO: hgraph API returns timestamp as number and nanoseconds precision is lost during parsing
  // instead of checking eq timestamp we need to fetch transactions in a small range
  // this can be changed to `timestamp=eq:${timestamp}` once hgraph returns timestamp as string
  // substract/add 10 microseconds to bypass hgraph precision issue
  const timestampAsNumber = new BigNumber(timestamp).multipliedBy(10 ** 9);
  const timestampDiffNs = new BigNumber(10_000);
  const from = new BigNumber(timestampAsNumber).minus(timestampDiffNs).dividedBy(10 ** 9);
  const to = new BigNumber(timestampAsNumber).plus(timestampDiffNs).dividedBy(10 ** 9);

  const params = new URLSearchParams({ limit: "100", order: "desc" });
  params.append("timestamp", `gte:${from.toFixed(9)}`);
  params.append("timestamp", `lte:${to.toFixed(9)}`);

  const res = await network<HederaMirrorTransactionsResponse>({
    method: "GET",
    url: `${API_URL}/api/v1/transactions?${params.toString()}`,
  });

  // try to find the CONTRACT_CALL transaction related to the given address
  const relatedTx = res.data.transactions.find(tx => {
    return (
      tx.name === HEDERA_TRANSACTION_NAMES.ContractCall &&
      tx.transaction_id.startsWith(payerAddress)
    );
  });

  return relatedTx ?? null;
}

async function estimateContractCallGas(
  senderEvmAddress: string,
  recipientEvmAddress: string,
  contractEvmAddress: string,
  amount: bigint,
): Promise<BigNumber> {
  const res = await network<HederaMirrorContractCallEstimate>({
    method: "POST",
    url: `${API_URL}/api/v1/contracts/call`,
    data: {
      block: "latest",
      estimate: true,
      from: senderEvmAddress,
      to: contractEvmAddress,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipientEvmAddress as `0x${string}`, amount],
      }),
    },
  });

  return new BigNumber(res.data.result);
}

async function getTransactionsByTimestampRange({
  address,
  startTimestamp,
  endTimestamp,
  order = "desc",
  limit = 100,
}: {
  startTimestamp: `${string}:${string}`;
  endTimestamp: `${string}:${string}`;
  address?: string;
  order?: "asc" | "desc";
  limit?: number;
}): Promise<HederaMirrorTransaction[]> {
  const transactions: HederaMirrorTransaction[] = [];
  const params = new URLSearchParams({
    limit: limit.toString(),
    order,
    ...(address && { "account.id": address }),
  });

  params.append("timestamp", startTimestamp);
  params.append("timestamp", endTimestamp);

  let nextPath: string | null = `/api/v1/transactions?${params.toString()}`;

  while (nextPath) {
    const res: LiveNetworkResponse<HederaMirrorTransactionsResponse> = await network({
      method: "GET",
      url: `${API_URL}${nextPath}`,
    });
    const newTransactions = res.data.transactions;
    transactions.push(...newTransactions);
    nextPath = res.data.links.next;
  }

  return transactions;
}

async function getNodes({
  cursor,
  limit = 100,
  order = "desc",
  fetchAllPages,
}: {
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
  fetchAllPages: boolean;
}): Promise<{ nodes: HederaMirrorNode[]; nextCursor: string | null }> {
  const nodes: HederaMirrorNode[] = [];
  const params = new URLSearchParams({
    order,
    limit: limit.toString(),
  });

  if (cursor) {
    params.append("node.id", `${getPaginationDirection(fetchAllPages, order)}:${cursor}`);
  }

  let nextCursor: string | null = null;
  let nextPath: string | null = `/api/v1/network/nodes?${params.toString()}`;

  while (nextPath) {
    const res: LiveNetworkResponse<HederaMirrorNodesResponse> = await network({
      method: "GET",
      url: `${API_URL}${nextPath}`,
    });
    const newNodes = res.data.nodes;
    nodes.push(...newNodes);
    nextPath = res.data.links.next;

    // stop fetching if pagination mode is used and we reached the limit
    if (!fetchAllPages && nodes.length >= limit) {
      break;
    }
  }

  // ensure we don't exceed the limit in pagination mode
  if (!fetchAllPages && nodes.length > limit) {
    nodes.splice(limit);
  }

  // set the next cursor only if we have more nodes to fetch
  if (!fetchAllPages && nextPath) {
    const lastNode = nodes.at(-1);
    nextCursor = lastNode?.node_id?.toString() ?? null;
  }

  return { nodes, nextCursor };
}

export const apiClient = {
  getAccountsForPublicKey,
  getAccount,
  getAccountTokens,
  getAccountTransactions,
  getLatestTransaction,
  getNetworkFees,
  getContractCallResult,
  findTransactionByContractCall,
  estimateContractCallGas,
  getTransactionsByTimestampRange,
  getNodes,
};

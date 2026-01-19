import { LedgerAPI4xx } from "@ledgerhq/errors";
import network from "@ledgerhq/live-network";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import BigNumber from "bignumber.js";
import { encodeFunctionData, erc20Abi } from "viem";
import { type HederaCoinConfig } from "../config";
import { HEDERA_TRANSACTION_NAMES } from "../constants";
import { HederaAddAccountError } from "../errors";
import { resolveConfig } from "../logic/utils";
import type {
  HederaMirrorAccountTokensResponse,
  HederaMirrorBlocksResponse,
  HederaMirrorTransactionsResponse,
  HederaMirrorAccount,
  HederaMirrorAccountsResponse,
  HederaMirrorBlock,
  HederaMirrorToken,
  HederaMirrorTransaction,
  HederaMirrorNetworkFees,
  HederaMirrorContractCallResult,
  HederaMirrorContractCallBalance,
  HederaMirrorContractCallEstimate,
  HederaMirrorNode,
  HederaMirrorNodesResponse,
} from "../types";

// keeps old behavior when all pages are fetched
const getPaginationDirection = (fetchAllPages: boolean, order: string) => {
  if (fetchAllPages) return "gt";
  return order === "asc" ? "gt" : "lt";
};

async function getAccountsForPublicKey({
  configOrCurrencyId,
  publicKey,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  publicKey: string;
}): Promise<HederaMirrorAccount[]> {
  const config = resolveConfig(configOrCurrencyId);

  let res;
  try {
    res = await network<HederaMirrorAccountsResponse>({
      method: "GET",
      url: `${config.apiUrls.mirrorNode}/api/v1/accounts?account.publicKey=${publicKey}&balance=true&limit=100`,
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
async function getAccount({
  configOrCurrencyId,
  address,
  timestamp,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
  timestamp?: string;
}): Promise<HederaMirrorAccount> {
  const config = resolveConfig(configOrCurrencyId);

  try {
    const params = new URLSearchParams({
      transactions: "false",
      ...(timestamp && { timestamp }),
    });

    const res = await network<HederaMirrorAccount>({
      method: "GET",
      url: `${config.apiUrls.mirrorNode}/api/v1/accounts/${address}?${params.toString()}`,
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

async function getAccountTransactions({
  configOrCurrencyId,
  address,
  pagingToken,
  limit = 100,
  order = "desc",
  fetchAllPages,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
  pagingToken: string | null;
  limit?: number | undefined;
  order?: "asc" | "desc" | undefined;
  fetchAllPages: boolean;
}): Promise<{ transactions: HederaMirrorTransaction[]; nextCursor: string | null }> {
  const config = resolveConfig(configOrCurrencyId);
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
      url: `${config.apiUrls.mirrorNode}${nextPath}`,
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

async function getAccountTokens({
  configOrCurrencyId,
  address,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
}): Promise<HederaMirrorToken[]> {
  const config = resolveConfig(configOrCurrencyId);
  const tokens: HederaMirrorToken[] = [];
  const params = new URLSearchParams({
    limit: "100",
  });

  let nextPath: string | null = `/api/v1/accounts/${address}/tokens?${params.toString()}`;

  while (nextPath) {
    const res: LiveNetworkResponse<HederaMirrorAccountTokensResponse> = await network({
      method: "GET",
      url: `${config.apiUrls.mirrorNode}${nextPath}`,
    });
    const newTokens = res.data.tokens;
    tokens.push(...newTokens);
    nextPath = res.data.links.next;
  }

  return tokens;
}

async function getLatestTransaction({
  configOrCurrencyId,
  before,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  before: Date;
}): Promise<HederaMirrorTransaction> {
  const config = resolveConfig(configOrCurrencyId);
  const params = new URLSearchParams({
    limit: "1",
    order: "desc",
    timestamp: `lt:${before.getTime() / 1000}`,
  });

  const res = await network<HederaMirrorTransactionsResponse>({
    method: "GET",
    url: `${config.apiUrls.mirrorNode}/api/v1/transactions?${params.toString()}`,
  });
  const transaction = res.data.transactions[0];

  if (!transaction) {
    throw new Error("No transactions found on the Hedera network");
  }

  return transaction;
}

async function getLatestBlock({
  configOrCurrencyId,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
}): Promise<HederaMirrorBlock> {
  const config = resolveConfig(configOrCurrencyId);
  const params = new URLSearchParams({
    limit: "1",
    order: "desc",
  });

  const res = await network<HederaMirrorBlocksResponse>({
    method: "GET",
    url: `${config.apiUrls.mirrorNode}/api/v1/blocks?${params.toString()}`,
  });
  const block = res.data.blocks[0];

  if (!block) {
    throw new Error("No blocks found on the Hedera network");
  }

  return block;
}

async function getNetworkFees({
  configOrCurrencyId,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
}): Promise<HederaMirrorNetworkFees> {
  const config = resolveConfig(configOrCurrencyId);
  const res = await network<HederaMirrorNetworkFees>({
    method: "GET",
    url: `${config.apiUrls.mirrorNode}/api/v1/network/fees`,
  });

  return res.data;
}

async function getContractCallResult({
  configOrCurrencyId,
  transactionHash,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  transactionHash: string;
}): Promise<HederaMirrorContractCallResult> {
  const config = resolveConfig(configOrCurrencyId);
  const res = await network<HederaMirrorContractCallResult>({
    method: "GET",
    url: `${config.apiUrls.mirrorNode}/api/v1/contracts/results/${transactionHash}`,
  });

  return res.data;
}

// TODO: remove once migration to new API is complete
async function findTransactionByContractCall({
  configOrCurrencyId,
  timestamp,
  contractId,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  timestamp: string;
  contractId: string;
}): Promise<HederaMirrorTransaction | null> {
  const config = resolveConfig(configOrCurrencyId);

  const res = await network<HederaMirrorTransactionsResponse>({
    method: "GET",
    url: `${config.apiUrls.mirrorNode}/api/v1/transactions?timestamp=${timestamp}`,
  });
  const transactions = res.data.transactions;
  const relatedTx = transactions.find(
    el => el.name === HEDERA_TRANSACTION_NAMES.ContractCall && el.entity_id === contractId,
  );

  return relatedTx ?? null;
}

async function findTransactionByContractCallV2({
  configOrCurrencyId,
  timestamp,
  payerAddress,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  timestamp: string;
  payerAddress: string;
}): Promise<HederaMirrorTransaction | null> {
  const config = resolveConfig(configOrCurrencyId);

  // Hgraph API returns timestamp as number and nanoseconds precision is lost during parsing
  // instead of using `timestamp=eq:${timestamp}`, we need to fetch transactions in a small range
  // +-10 microseconds is used to bypass hgraph precision issue
  const timestampAsNumber = new BigNumber(timestamp).multipliedBy(10 ** 9);
  const timestampDiffNs = new BigNumber(10_000);
  const from = new BigNumber(timestampAsNumber).minus(timestampDiffNs).dividedBy(10 ** 9);
  const to = new BigNumber(timestampAsNumber).plus(timestampDiffNs).dividedBy(10 ** 9);

  const params = new URLSearchParams({ limit: "100", order: "desc" });
  params.append("timestamp", `gte:${from.toFixed(9)}`);
  params.append("timestamp", `lte:${to.toFixed(9)}`);

  const res = await network<HederaMirrorTransactionsResponse>({
    method: "GET",
    url: `${config.apiUrls.mirrorNode}/api/v1/transactions?${params.toString()}`,
  });

  // try to find main CONTRACT_CALL transaction related to the given address
  const relatedTx = res.data.transactions.find(tx => {
    return (
      tx.name === HEDERA_TRANSACTION_NAMES.ContractCall &&
      tx.transaction_id.startsWith(payerAddress) &&
      tx.parent_consensus_timestamp === null
    );
  });

  return relatedTx ?? null;
}

// TODO: remove once migration to new API is complete
async function getERC20Balance({
  configOrCurrencyId,
  accountEvmAddress,
  contractEvmAddress,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  accountEvmAddress: string;
  contractEvmAddress: string;
}): Promise<BigNumber> {
  const config = resolveConfig(configOrCurrencyId);
  const res = await network<HederaMirrorContractCallBalance>({
    method: "POST",
    url: `${config.apiUrls.mirrorNode}/api/v1/contracts/call`,
    data: {
      block: "latest",
      to: contractEvmAddress,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [accountEvmAddress as `0x${string}`],
      }),
    },
  });

  return new BigNumber(res.data.result);
}

async function estimateContractCallGas({
  configOrCurrencyId,
  senderEvmAddress,
  recipientEvmAddress,
  contractEvmAddress,
  amount,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  senderEvmAddress: string;
  recipientEvmAddress: string;
  contractEvmAddress: string;
  amount: bigint;
}): Promise<BigNumber> {
  const config = resolveConfig(configOrCurrencyId);

  const res = await network<HederaMirrorContractCallEstimate>({
    method: "POST",
    url: `${config.apiUrls.mirrorNode}/api/v1/contracts/call`,
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
  configOrCurrencyId,
  address,
  startTimestamp,
  endTimestamp,
  limit = 100,
  order = "desc",
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address?: string;
  startTimestamp: `${string}:${string}`;
  endTimestamp: `${string}:${string}`;
  limit?: number;
  order?: "asc" | "desc";
}): Promise<HederaMirrorTransaction[]> {
  const config = resolveConfig(configOrCurrencyId);
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
      url: `${config.apiUrls.mirrorNode}${nextPath}`,
    });
    const newTransactions = res.data.transactions;
    transactions.push(...newTransactions);
    nextPath = res.data.links.next;
  }

  return transactions;
}

async function getNode({
  configOrCurrencyId,
  nodeId,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  nodeId: number;
}): Promise<HederaMirrorNode | null> {
  const config = resolveConfig(configOrCurrencyId);
  const params = new URLSearchParams({
    "node.id": `eq:${nodeId}`,
    limit: "1",
  });

  const res = await network<HederaMirrorNodesResponse>({
    method: "GET",
    url: `${config.apiUrls.mirrorNode}/api/v1/network/nodes?${params.toString()}`,
  });
  return res.data.nodes[0] ?? null;
}

async function getNodes({
  configOrCurrencyId,
  cursor,
  limit = 100,
  order = "desc",
  fetchAllPages,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
  fetchAllPages: boolean;
}): Promise<{ nodes: HederaMirrorNode[]; nextCursor: string | null }> {
  const config = resolveConfig(configOrCurrencyId);
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
      url: `${config.apiUrls.mirrorNode}${nextPath}`,
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
  getLatestBlock,
  getLatestTransaction,
  getNetworkFees,
  getContractCallResult,
  findTransactionByContractCall,
  findTransactionByContractCallV2,
  getERC20Balance,
  estimateContractCallGas,
  getTransactionsByTimestampRange,
  getNode,
  getNodes,
};

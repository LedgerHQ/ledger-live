import BigNumber from "bignumber.js";
import { encodeFunctionData, erc20Abi } from "viem";
import network from "@ledgerhq/live-network";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import { LedgerAPI4xx } from "@ledgerhq/errors";
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
  HederaMirrorContractCallBalance,
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

async function getAccount(address: string): Promise<HederaMirrorAccount> {
  try {
    const res = await network<HederaMirrorAccount>({
      method: "GET",
      url: `${API_URL}/api/v1/accounts/${address}`,
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

  // keeps old behavior when all pages are fetched
  const getTimestampDirection = () => {
    if (fetchAllPages) return "gt";
    return order === "asc" ? "gt" : "lt";
  };

  if (pagingToken) {
    params.append("timestamp", `${getTimestampDirection()}:${pagingToken}`);
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

async function getLatestTransaction(): Promise<HederaMirrorTransaction> {
  const params = new URLSearchParams({
    limit: "1",
    order: "desc",
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

async function findTransactionByContractCall(
  timestamp: string,
  contractId: string,
): Promise<HederaMirrorTransaction | null> {
  const res = await network<HederaMirrorTransactionsResponse>({
    method: "GET",
    url: `${API_URL}/api/v1/transactions?timestamp=${timestamp}`,
  });
  const transactions = res.data.transactions;

  return transactions.find(el => el.name === "CONTRACTCALL" && el.entity_id === contractId) ?? null;
}

async function getERC20Balance(
  accountEvmAddress: string,
  contractEvmAddress: string,
): Promise<BigNumber> {
  const res = await network<HederaMirrorContractCallBalance>({
    method: "POST",
    url: `${API_URL}/api/v1/contracts/call`,
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

async function getTransactionsByTimestampRange(
  startTimestamp: string,
  endTimestamp: string,
): Promise<HederaMirrorTransaction[]> {
  const transactions: HederaMirrorTransaction[] = [];
  const params = new URLSearchParams({
    limit: "100",
    order: "desc",
  });

  params.append("timestamp", `gte:${startTimestamp}`);
  params.append("timestamp", `lt:${endTimestamp}`);

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

async function getNodes(): Promise<HederaMirrorNode[]> {
  const nodes: HederaMirrorNode[] = [];
  const params = new URLSearchParams({
    order: "desc",
    limit: "100",
  });

  let nextPath: string | null = `/api/v1/network/nodes?${params.toString()}`;

  while (nextPath) {
    const res: LiveNetworkResponse<HederaMirrorNodesResponse> = await network({
      method: "GET",
      url: `${API_URL}${nextPath}`,
    });
    const newNodes = res.data.nodes;
    nodes.push(...newNodes);
    nextPath = res.data.links.next;
  }

  return nodes;
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
  getERC20Balance,
  estimateContractCallGas,
  getTransactionsByTimestampRange,
  getNodes,
};

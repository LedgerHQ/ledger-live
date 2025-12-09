import { pad } from "viem";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import { HEDERA_MAINNET_CHAIN_ID, ERC20_TRANSFER_EVENT_TOPIC } from "../constants";
import { toEVMAddress } from "../logic/utils";
import type { HederaThirdwebTransaction, HederaThirdwebContractEventsResponse } from "../types";
import invariant from "invariant";

interface FetchOptions extends Record<string, string> {
  filterBlockTimestampLte?: string;
  filterBlockTimestampGte?: string;
  filterTopic0: string;
  filterTopic1?: string;
  filterTopic2?: string;
  limit: string;
}

const API_URL = getEnv("API_HEDERA_THIRDWEB_URL");

async function fetchERC20Transactions({
  contractAddress,
  options,
  fetchAllPages = false,
}: {
  contractAddress: string;
  options: FetchOptions;
  fetchAllPages?: boolean;
}): Promise<HederaThirdwebTransaction[]> {
  const transactions: HederaThirdwebTransaction[] = [];
  const params = new URLSearchParams(options);
  const requestedLimit = Number(options.limit);
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    params.set("page", page.toString());
    const response = await network<HederaThirdwebContractEventsResponse>({
      method: "GET",
      url: `${API_URL}/v1/contracts/${HEDERA_MAINNET_CHAIN_ID}/${contractAddress}/events?${params.toString()}`,
    });
    const newTransactions = response.data.result.events;
    transactions.push(...newTransactions);

    // stop conditions:
    // - we received fewer items than the limit or no items
    // - we reached the requested limit in pagination mode (fetchAllPages = false)
    if (newTransactions.length < requestedLimit || newTransactions.length === 0) {
      hasMorePages = false;
    } else if (!fetchAllPages && transactions.length >= requestedLimit) {
      break;
    } else {
      page++;
    }
  }

  // ensure we don't exceed the limit in pagination mode
  if (!fetchAllPages && transactions.length > requestedLimit) {
    transactions.splice(requestedLimit);
  }

  return transactions;
}

async function getERC20TransactionsForAccount({
  address,
  contractAddresses,
  transactionFetcher = fetchERC20Transactions,
  order,
  from,
  to,
  limit,
  fetchAllPages,
}: {
  address: string;
  contractAddresses: string[];
  order?: "asc" | "desc" | null;
  from?: string | null;
  to?: string | null;
  limit?: number | null;
  fetchAllPages?: boolean;
  transactionFetcher?: typeof fetchERC20Transactions; // optional dependency injection for testing
}): Promise<HederaThirdwebTransaction[]> {
  const allTransactions: HederaThirdwebTransaction[] = [];
  const evmAddress = await toEVMAddress(address);
  invariant(evmAddress, "hedera: evm address is missing");

  if (contractAddresses.length === 0) {
    return [];
  }

  const sortOrder = order ?? "desc";

  const baseParams = {
    limit: limit?.toString() ?? "100",
    sortOrder,
    filterTopic0: ERC20_TRANSFER_EVENT_TOPIC,
    ...(from && { filterBlockTimestampGte: from }),
    ...(to && { filterBlockTimestampLte: to }),
  } as const;

  for (const contractAddress of contractAddresses) {
    const outTransactionOptions: FetchOptions = {
      ...baseParams,
      filterTopic1: pad(evmAddress as `0x${string}`).toString(),
    };

    const inTransactionOptions: FetchOptions = {
      ...baseParams,
      filterTopic2: pad(evmAddress as `0x${string}`).toString(),
    };

    const outgoingTxs = await transactionFetcher({
      contractAddress,
      options: outTransactionOptions,
      ...(fetchAllPages && { fetchAllPages }),
    });

    const incomingTxs = await transactionFetcher({
      contractAddress,
      options: inTransactionOptions,
      ...(fetchAllPages && { fetchAllPages }),
    });

    allTransactions.push(...outgoingTxs, ...incomingTxs);
  }

  // sort all transactions
  allTransactions.sort((a, b) => {
    const aTime = a.blockTimestamp;
    const bTime = b.blockTimestamp;

    if (aTime !== bTime) {
      return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
    }

    return sortOrder === "desc"
      ? b.transactionIndex - a.transactionIndex
      : a.transactionIndex - b.transactionIndex;
  });

  // ensure we don't exceed the limit in pagination mode
  if (!fetchAllPages && limit && allTransactions.length > limit) {
    allTransactions.splice(limit);
  }

  return allTransactions;
}

async function getTransactionsByTimestampRange({
  contractAddresses,
  startTimestamp,
  endTimestamp,
}: {
  contractAddresses: string[];
  startTimestamp: string;
  endTimestamp: string;
}): Promise<HederaThirdwebTransaction[]> {
  const transactionsPerContract = await Promise.all(
    contractAddresses.map(contractAddress =>
      fetchERC20Transactions({
        contractAddress,
        fetchAllPages: true,
        options: {
          limit: "100",
          sortOrder: "desc",
          filterTopic0: ERC20_TRANSFER_EVENT_TOPIC,
          filterBlockTimestampGte: startTimestamp,
          filterBlockTimestampLte: endTimestamp,
        },
      }),
    ),
  );

  // sort (respecting the index if block timestamp is the same) and flatten all transactions
  const transactions = transactionsPerContract.flat();
  transactions.sort((a, b) => {
    const aTime = a.blockTimestamp;
    const bTime = b.blockTimestamp;

    if (aTime !== bTime) {
      return bTime - aTime;
    }

    return b.transactionIndex - a.transactionIndex;
  });

  return transactions;
}

// Thirdweb API is used in addition to mirror node because:
// - mirror node has a 1-week range limitation for ERC20 events queries
// - mirror node has rate limits that we could exceed with ERC20 integration
export const thirdwebClient = {
  fetchERC20Transactions,
  getERC20TransactionsForAccount,
  getTransactionsByTimestampRange,
};

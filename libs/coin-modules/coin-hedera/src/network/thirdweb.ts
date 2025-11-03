import { pad } from "viem";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import { HEDERA_MAINNET_CHAIN_ID, ERC20_TRANSFER_EVENT_TOPIC } from "../constants";
import { toEVMAddress } from "../logic/utils";
import type { HederaThirdwebTransaction, HederaThirdwebContractEventsResponse } from "../types";

interface FetchOptions extends Record<string, string> {
  filterBlockTimestampGte?: string;
  filterTopic0: string;
  filterTopic1?: string;
  filterTopic2?: string;
  limit: string;
}

const API_URL = getEnv("API_HEDERA_THIRDWEB_URL");

async function fetchERC20Transactions(
  contractAddress: string,
  options: FetchOptions,
): Promise<HederaThirdwebTransaction[]> {
  const transactions: HederaThirdwebTransaction[] = [];
  const params = new URLSearchParams(options);
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

    // stop if we received fewer items than the limit or no items
    if (newTransactions.length < Number(options.limit) || newTransactions.length === 0) {
      hasMorePages = false;
    } else {
      page++;
    }
  }

  return transactions;
}

async function getERC20TransactionsForAccount({
  address,
  contractAddresses,
  transactionFetcher = fetchERC20Transactions,
  since,
}: {
  address: string;
  contractAddresses: string[];
  since?: string | null;
  transactionFetcher?: typeof fetchERC20Transactions; // optional dependency injection for testing
}): Promise<HederaThirdwebTransaction[]> {
  const allTransactions: HederaThirdwebTransaction[] = [];
  const evmAddress = toEVMAddress(address);

  if (contractAddresses.length === 0) {
    return allTransactions;
  }

  if (!evmAddress) {
    return allTransactions;
  }

  const baseParams = {
    limit: "1000",
    filterTopic0: ERC20_TRANSFER_EVENT_TOPIC,
    ...(since && { filterBlockTimestampGte: since }),
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

    const outgoingTxs = await transactionFetcher(contractAddress, outTransactionOptions);
    const incomingTxs = await transactionFetcher(contractAddress, inTransactionOptions);

    allTransactions.push(...outgoingTxs, ...incomingTxs);
  }

  return allTransactions;
}

// Thirdweb API is used in addition to mirror node because:
// - mirror node has a 1-week range limitation for ERC20 events queries
// - mirror node has rate limits that we could exceed with ERC20 integration
export const thirdwebClient = {
  fetchERC20Transactions,
  getERC20TransactionsForAccount,
};

import BigNumber from "bignumber.js";
import invariant from "invariant";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import type {
  ERC20TokenAccount,
  ERC20TokenTransfer,
  HgraphErcTokenAccountResponse,
  HgraphErcTokenTransferResponse,
  HgraphLatestIndexedConsensusTimestampResponse,
  HgraphResponse,
} from "../types/hgraph";

// keeps old behavior when all pages are fetched
const getPaginationDirection = (fetchAllPages: boolean, order: string) => {
  if (fetchAllPages) return "_gt";
  return order === "asc" ? "_gt" : "_lt";
};

const throwOnGraphQLErrors: <T>(
  res: LiveNetworkResponse<HgraphResponse<T>>,
  context: string,
) => asserts res is LiveNetworkResponse<{ data: T }> = (res, context) => {
  if ("errors" in res.data) {
    const reason = res.data.errors[0]?.message ?? "";
    throw new Error(`failed to fetch ${context} from Hgraph: ${reason}`);
  }
};

async function getLastestIndexedConsensusTimestamp(): Promise<BigNumber> {
  const res = await network<HgraphLatestIndexedConsensusTimestampResponse>({
    url: getEnv("API_HEDERA_HGRAPH"),
    method: "POST",
    data: {
      query: `
        query LatestTransaction {
          ethereum_transaction(
            limit: 1, 
            order_by: { consensus_timestamp: desc }
          ) {
            consensus_timestamp
          }
        }
      `,
    },
  });

  throwOnGraphQLErrors(res, "latest indexed consensus timestamp");

  const lastTransactionTimestamp = res.data.data.ethereum_transaction[0]?.consensus_timestamp;
  invariant(lastTransactionTimestamp, "No transactions found in Hgraph");

  return new BigNumber(lastTransactionTimestamp);
}

async function getERC20Balances({ address }: { address: string }): Promise<ERC20TokenAccount[]> {
  const res = await network<HgraphErcTokenAccountResponse>({
    url: getEnv("API_HEDERA_HGRAPH"),
    method: "POST",
    data: {
      query: `
        query GetAccountPortfolio($accountId: bigint!) {
          erc_token_account(
              where: {
                  account_id: { _eq: $accountId }
              }
          ) {
              token_id
              balance
              balance_timestamp
              created_timestamp
          }
        }
      `,
      variables: {
        accountId: address.split(".").pop(),
      },
    },
  });

  throwOnGraphQLErrors(res, "ERC20 balances");

  return res.data.data.erc_token_account;
}

async function getERC20Transfers({
  address,
  tokenEvmAddresses,
  timestamp,
  limit = 100,
  order = "desc",
  fetchAllPages,
}: {
  address: string;
  tokenEvmAddresses: string[];
  fetchAllPages: boolean;
  timestamp?: string;
  limit?: number;
  order?: "asc" | "desc";
}): Promise<ERC20TokenTransfer[]> {
  if (tokenEvmAddresses.length === 0) {
    return [];
  }

  let hasMorePages = true;
  let cursor = timestamp?.replace(".", "") ?? null;
  const transfers: ERC20TokenTransfer[] = [];
  const accountId = address.split(".").pop();

  while (hasMorePages) {
    const res = await network<HgraphErcTokenTransferResponse>({
      url: getEnv("API_HEDERA_HGRAPH"),
      method: "POST",
      data: {
        query: `
          query GetAccountTransfers($accountId: bigint!, $tokenEvmAddresses: [String!]!, $cursor: bigint, $limit: Int!) {
            erc_token_transfer(
                where: {
                    transfer_type: { _eq: "transfer" }
                    contract_type: { _eq: "ERC_20" }
                    token_evm_address: { _in: $tokenEvmAddresses }
                    ${cursor ? `consensus_timestamp: { ${getPaginationDirection(fetchAllPages, order)}: $cursor }` : ""}
                    _or: [
                        { sender_account_id: { _eq: $accountId } }
                        { receiver_account_id: { _eq: $accountId } }
                    ]
                }
                order_by: { consensus_timestamp: ${order} }
                limit: $limit
            ) {
                token_id
                token_evm_address
                sender_evm_address
                sender_account_id
                receiver_evm_address
                receiver_account_id
                payer_account_id
                amount
                transfer_type
                consensus_timestamp
                transaction_hash
            }
          }
        `,
        variables: {
          accountId,
          tokenEvmAddresses,
          limit,
          ...(cursor && { cursor }),
        },
      },
    });

    throwOnGraphQLErrors(res, "ERC20 transfers");

    const newTransfers = res.data.data.erc_token_transfer;
    transfers.push(...newTransfers);

    // stop fetching if pagination mode is used and we reached the limit
    if (!fetchAllPages && transfers.length >= limit) {
      hasMorePages = false;
    }

    // stop if no more results (empty array indicates no more data)
    if (newTransfers.length === 0 || newTransfers.length < limit) {
      hasMorePages = false;
    }

    if (hasMorePages) {
      // update cursor to the last item's timestamp for next iteration
      const lastTransfer = newTransfers[newTransfers.length - 1];
      cursor = lastTransfer.consensus_timestamp.toString();
    }
  }

  // ensure we don't exceed the limit when not fetching all pages
  if (!fetchAllPages && transfers.length > limit) {
    transfers.splice(limit);
  }

  return transfers;
}

async function getERC20TransfersByTimestampRange({
  startTimestamp,
  endTimestamp,
  order = "desc",
  limit = 100,
}: {
  startTimestamp: string;
  endTimestamp: string;
  order?: "asc" | "desc";
  limit?: number;
}): Promise<ERC20TokenTransfer[]> {
  const transfers: ERC20TokenTransfer[] = [];
  let hasMorePages = true;
  let cursor: string | null = null;
  const normalizedStartTimestamp = startTimestamp.replace(".", "");
  const normalizedEndTimestamp = endTimestamp.replace(".", "");

  while (hasMorePages) {
    const res: LiveNetworkResponse<HgraphErcTokenTransferResponse> = await network({
      url: getEnv("API_HEDERA_HGRAPH"),
      method: "POST",
      data: {
        query: `
          query GetAccountTransfers($startTimestamp: bigint!, $endTimestamp: bigint!, $cursor: bigint, $limit: Int!) {
            erc_token_transfer(
                where: {
                    transfer_type: { _eq: "transfer" }
                    contract_type: { _eq: "ERC_20" }
                    consensus_timestamp: { 
                      ${cursor ? "_gt: $cursor" : "_gte: $startTimestamp"}
                      _lt: $endTimestamp 
                    }
                }
                order_by: { consensus_timestamp: ${order} }
                limit: $limit
            ) {
                token_id
                token_evm_address
                sender_evm_address
                sender_account_id
                receiver_evm_address
                receiver_account_id
                payer_account_id
                amount
                transfer_type
                consensus_timestamp
                transaction_hash
            }
          }
        `,
        variables: {
          startTimestamp: normalizedStartTimestamp,
          endTimestamp: normalizedEndTimestamp,
          limit,
          ...(cursor && { cursor }),
        },
      },
    });

    throwOnGraphQLErrors(res, "ERC20 transfers by timestamp range");

    const newTransfers = res.data.data.erc_token_transfer;
    transfers.push(...newTransfers);

    // stop if no more results
    if (newTransfers.length === 0 || newTransfers.length < limit) {
      hasMorePages = false;
    }

    if (hasMorePages) {
      // update cursor to the last item's timestamp for next iteration
      const lastTransfer = newTransfers[newTransfers.length - 1];
      cursor = lastTransfer.consensus_timestamp.toString();
    }
  }

  return transfers;
}

export const hgraphClient = {
  getLastestIndexedConsensusTimestamp,
  getERC20Balances,
  getERC20Transfers,
  getERC20TransfersByTimestampRange,
};

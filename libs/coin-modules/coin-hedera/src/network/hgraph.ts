import network from "@ledgerhq/live-network";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { resolveConfig } from "../logic/utils";
import type {
  HederaCoinConfig,
  ERC20TokenAccount,
  ERC20TokenTransfer,
  HgraphErcTokenAccountResponse,
  HgraphErcTokenTransferResponse,
  HgraphLatestIndexedConsensusTimestampResponse,
  HgraphResponse,
} from "../types";

const getPaginationDirection = (fetchAllPages: boolean, order: string) => {
  if (fetchAllPages) return "_gt";
  return order === "asc" ? "_gt" : "_lt";
};

// `consensus_timestamp` is nanoseconds here, while the mirror node spells a timestamp
// `<seconds>[.<fraction>]` — dropping the dot lines the two up only for a 9-digit fraction.
const toNanoseconds = (timestamp: string): string => {
  const [seconds, fraction = ""] = timestamp.split(".");
  return seconds + fraction.padEnd(9, "0");
};

const throwOnGraphQLErrors: <T>(
  res: LiveNetworkResponse<HgraphResponse<T>>,
  context: string,
) => asserts res is LiveNetworkResponse<{ data: T }> = (res, context) => {
  if ("errors" in res.data) {
    const reason = res.data.errors[0]?.message ?? "";
    throw new Error(`hedera: failed to fetch ${context} from Hgraph: ${reason}`);
  }
};

async function getLatestIndexedConsensusTimestamp({
  configOrCurrencyId,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
}): Promise<BigNumber> {
  const config = resolveConfig(configOrCurrencyId);
  const res = await network<HgraphLatestIndexedConsensusTimestampResponse>({
    url: config.apiUrls.hgraph,
    method: "POST",
    data: {
      query: `
        query ErcWatermark {
          erc_watermark(where: { job_name: { _eq: "transfer_indexing" } }) {
            last_processed_ns
          }
        }
      `,
    },
  });

  throwOnGraphQLErrors(res, "latest indexed consensus timestamp");

  const lastProcessedNs = res.data.data.erc_watermark[0]?.last_processed_ns;
  invariant(lastProcessedNs, "No ERC20 watermark found in Hgraph");

  return new BigNumber(lastProcessedNs);
}

async function getERC20Balances({
  configOrCurrencyId,
  address,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
}): Promise<ERC20TokenAccount[]> {
  const config = resolveConfig(configOrCurrencyId);

  const res = await network<HgraphErcTokenAccountResponse>({
    url: config.apiUrls.hgraph,
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
              token_evm_address
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
  configOrCurrencyId,
  address,
  tokenEvmAddresses,
  timestamp,
  limit = 100,
  order = "desc",
  fetchAllPages,
  minTimestamp,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
  tokenEvmAddresses: string[];
  fetchAllPages: boolean;
  timestamp?: string;
  limit?: number;
  order?: "asc" | "desc";
  /** A floor, not a page cursor like `timestamp`. */
  minTimestamp?: string;
}): Promise<ERC20TokenTransfer[]> {
  if (tokenEvmAddresses.length === 0) {
    return [];
  }

  const config = resolveConfig(configOrCurrencyId);
  let hasMorePages = true;
  let cursor = timestamp?.replace(".", "") ?? null;
  const minTimestampCursor = minTimestamp ? toNanoseconds(minTimestamp) : null;
  const transfers: ERC20TokenTransfer[] = [];
  const accountId = address.split(".").pop();

  // Merged into one `consensus_timestamp` object: a GraphQL input can't repeat a field name.
  const consensusTimestampConditions = [
    cursor && `${getPaginationDirection(fetchAllPages, order)}: $cursor`,
    minTimestampCursor && "_gte: $minTimestamp",
  ].filter(Boolean);

  while (hasMorePages) {
    const res = await network<HgraphErcTokenTransferResponse>({
      url: config.apiUrls.hgraph,
      method: "POST",
      data: {
        query: `
          query GetAccountTransfers($accountId: bigint!, $tokenEvmAddresses: [String!]!, $cursor: bigint, $minTimestamp: bigint, $limit: Int!) {
            erc_token_transfer(
                where: {
                    transfer_type: { _in: ["transfer", "mint", "burn"] }
                    contract_type: { _eq: "ERC_20" }
                    token_evm_address: { _in: $tokenEvmAddresses }
                    ${consensusTimestampConditions.length ? `consensus_timestamp: { ${consensusTimestampConditions.join(", ")} }` : ""}
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
          ...(minTimestampCursor && { minTimestamp: minTimestampCursor }),
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
  configOrCurrencyId,
  startTimestamp,
  endTimestamp,
  order = "desc",
  limit = 100,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  startTimestamp: string;
  endTimestamp: string;
  order?: "asc" | "desc";
  limit?: number;
}): Promise<ERC20TokenTransfer[]> {
  const config = resolveConfig(configOrCurrencyId);
  const transfers: ERC20TokenTransfer[] = [];
  let hasMorePages = true;
  let cursor: string | null = null;
  const normalizedStartTimestamp = startTimestamp.replace(".", "");
  const normalizedEndTimestamp = endTimestamp.replace(".", "");

  while (hasMorePages) {
    const res: LiveNetworkResponse<HgraphErcTokenTransferResponse> = await network({
      url: config.apiUrls.hgraph,
      method: "POST",
      data: {
        query: `
          query GetAccountTransfers(${cursor ? "$cursor: bigint!" : "$startTimestamp: bigint!"}, $endTimestamp: bigint!, $limit: Int!) {
            erc_token_transfer(
                where: {
                    transfer_type: { _in: ["transfer", "mint", "burn"] }
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
          endTimestamp: normalizedEndTimestamp,
          limit,
          ...(cursor ? { cursor } : { startTimestamp: normalizedStartTimestamp }),
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
  getLatestIndexedConsensusTimestamp,
  getERC20Balances,
  getERC20Transfers,
  getERC20TransfersByTimestampRange,
};

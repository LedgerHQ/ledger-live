import network from "@ledgerhq/live-network/network";
import { SimpleHashResponse, SimpleHashSpamReportResponse } from "./types";
import { getEnv } from "@ledgerhq/live-env";

/**
 *
 * Doc for spam scores : https://docs.simplehash.com/reference/spam-scores
 *
 * https://docs.simplehash.com/reference/nfts-by-wallets-v2
 *
 * The score is a numeric value from 0 to 100, with 0 being deemed not spam,
 *  and 100 being deemed likely spam
 *
 * Filter by spam score could be used in many ways:
 * - spam_score__lte=80 : filter all NFTs with a spam score of 80 or less.
 * - spam_score__gte=80 : filter all NFTs with a spam score of 80 or more.
 * - spam_score__lt=80 : filter all NFTs with a spam score below 80.
 * - spam_score__gt=80 : filter all NFTs with a spam score above 80.
 */

export const Filters = {
  SPAM_LTE: "spam_score__lte",
  SPAM_GTE: "spam_score__gte",
};

const PAGE_SIZE = 50;

type NftFetchOpts = {
  /**
   * all chains to look for NFTs
   */
  chains: string[];
  /**
   * wallet addresses to get NFTs from. separated by a ","
   */
  addresses: string;
  /**
   * cursor used to paginate the API
   */
  cursor?: string;
  /**
   * number of NFT per page (not required, defaults to a constant)
   */
  limit?: number;
  /**
   * spam filtering mode, defaults to a constant %
   */
  filters?: Record<string, string>;
  /**
   * spam filtering threshold, defaults to a constant %
   */
  threshold?: number;
};
const defaultOpts = {
  limit: PAGE_SIZE,
  filters: {
    [Filters.SPAM_LTE]: "threshold",
  },
};

/**
 * Fetch NFTs for a list of wallets and chains of interest.
 * using SimpleHash API.
 */
export async function fetchNftsFromSimpleHash(opts: NftFetchOpts): Promise<SimpleHashResponse> {
  const { chains, addresses, limit, filters, cursor, threshold } = { ...defaultOpts, ...opts };
  const enrichedFilters = buildFilters(filters, { threshold: String(threshold) });
  const { data } = await network<SimpleHashResponse>({
    method: "GET",
    url: `${getEnv("SIMPLE_HASH_API_BASE")}/nfts/owners_v2?chains=${chains.join(
      ",",
    )}&wallet_addresses=${addresses}&limit=${limit}${filters ? enrichedFilters : ""}${
      cursor ? `&cursor=${cursor}` : ""
    }`,
  });

  return data;
}

export function buildFilters(filters: Record<string, string>, opts: Record<string, string>) {
  const bufferFilters: string[] = [];
  for (const [key, content] of Object.entries(filters)) {
    const filter = `${key}=${opts[content as keyof typeof opts]}`;
    bufferFilters.push(filter);
  }
  return `&filters=${bufferFilters.join(",")}`;
}

export enum EventType {
  mark_as_not_spam = "mark_as_not_spam",
  mark_as_spam = "mark_as_spam",
}

/**
 * @contractAddress: The contract address of the NFT reported, or the contract itself.
 * @chainId: The chain ID (e.g., ethereum) of the NFT or contract reported.
 * @collectionId: The SimpleHash collection ID of the NFT reported.
 * @tokenId: The token ID of the NFT reported.
 * @eventType: The type of event associated with the spam report, which can be one of the following: mark_as_spam or mark_as_not_spam.
 */

export type NftSpamReportOpts = {
  contractAddress?: string;
  chainId?: string;
  collectionId?: string;
  tokenId?: string;
  eventType: EventType;
};
/**
 * Send Spam Report using SimpleHash API.
 */
export async function reportSpamNtf(
  opts: NftSpamReportOpts,
): Promise<SimpleHashSpamReportResponse> {
  const url = `${getEnv("SIMPLE_HASH_API_BASE")}/nfts/report/spam`;
  const { data } = await network<SimpleHashSpamReportResponse>({
    method: "POST",
    url,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    data: JSON.stringify({
      contract_address: opts.contractAddress,
      chain_id: opts.chainId,
      token_id: opts.tokenId,
      collection_id: opts.collectionId,
      event_type: opts.eventType,
    }),
  });

  return data;
}

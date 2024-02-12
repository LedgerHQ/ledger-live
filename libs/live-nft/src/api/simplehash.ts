import network from "@ledgerhq/live-network/network";
import { SimpleHashResponse } from "./types";
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

import network from "@ledgerhq/live-network/network";
import { SimpleHashResponse } from "./types";

// TODO move to live-env
// import { getEnv } from "@ledgerhq/live-env";
const SIMPLE_HASH_API_BASE = "https://simplehash.api.live.ledger.com/api/v0";
////////////////////////

const SPAM_FILTER_THRESHOLD = 80;
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
  cursor: string | undefined;
  /**
   * number of NFT per page (not required, defaults to a constant)
   */
  limit?: number;
  /**
   * spam filtering mode, defaults to a constant %
   */
  filters?: string;
};
const defaultOpts = {
  limit: PAGE_SIZE,
  filters: `spam_score__lte%3D${SPAM_FILTER_THRESHOLD}`,
};

/**
 * Fetch NFTs for a list of wallets and chains of interest.
 * using SimpleHash API.
 */
export async function fetchNftsFromSimpleHash(opts: NftFetchOpts): Promise<SimpleHashResponse> {
  const { chains, addresses, limit, filters, cursor } = { ...defaultOpts, ...opts };

  const { data } = await network<SimpleHashResponse>({
    method: "GET",
    url: `${SIMPLE_HASH_API_BASE}/nfts/owners_v2?chains=${chains.join(
      ",",
    )}&wallet_addresses=${addresses}&limit=${limit}${filters ? `&filters=${filters}` : ""}${
      cursor ? `&cursor=${cursor}` : ""
    }`,
  });

  return data;
}

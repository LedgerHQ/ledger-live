import network from "@ledgerhq/live-network";
import { VECHAIN_NODE_URL as BASE_URL } from "../constants";
import type { ApiResponseBlock } from "../types";

// Thor GET /blocks/{revision}. `expanded` returns full clause/output detail (getBlock) vs. tx
// hashes only (getBlockInfo/lastBlock).
export const getBlock = async (
  revision: number,
  expanded = false,
): Promise<ApiResponseBlock | null> => {
  if (!Number.isInteger(revision) || revision < 0) {
    throw new Error(`vechain: getBlock: invalid revision ${revision}`);
  }

  const query = new URLSearchParams({ expanded: String(expanded) });

  const { data } = await network<ApiResponseBlock | null>({
    method: "GET",
    url: `${BASE_URL}/blocks/${revision}?${query}`,
  });

  return data;
};

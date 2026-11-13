import liveNetwork from "@ledgerhq/live-network";
import { type NearConfig } from "../config";

// live-network's default retried statuses without 429: a 429 is a quota refusal that cannot succeed
// before the quota resets, so retrying it only multiplies the load. Other errors keep the retry.
const NEARBLOCKS_RETRIED_STATUSES = [408, 413, 500, 502, 503, 504, 521, 522, 524] as const;

export const fetchNearblocks = async <T>(config: NearConfig, path: string): Promise<T> => {
  const response = await liveNetwork<T>({
    url: `${config.infra.API_NEARBLOCKS_INDEXER}${path}`,
    retry: { statuses: NEARBLOCKS_RETRIED_STATUSES },
  });

  return response.data;
};

import { makeLRUCache } from "../../cache";
import type { CacheRes } from "../../cache";
import { getNetworkConfig } from "./api";

/**
 * Cache the getTransactionInfo for fees estimation to avoid multiple calls during 5 minutes.
 * Should be force refresh when signing operation.
 *
 * @param {Account} account
 *
 * @returns {Promise<Object>} txInfo
 */
export const getTransactionParams: CacheRes<
  Array<void>,
  Record<string, any>
> = makeLRUCache(
  async (): Promise<Record<string, any>> => getNetworkConfig(),
  () => "elrond",
  {
    maxAge: 5 * 60 * 1000, // 5 minutes
  }
);

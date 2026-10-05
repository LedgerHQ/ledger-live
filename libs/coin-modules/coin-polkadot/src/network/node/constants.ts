import { type QueryableConsts } from "@polkadot/api/types";
import { type PolkadotCoinConfig } from "../../config";
import getApiPromise from "./apiPromise";

/**
 * Returns the blockchain's runtime constants.
 *
 * @async
 *
 * @returns {Promise<QueryableConsts<"promise">>}
 */
export const fetchConstants = async (
  config: PolkadotCoinConfig,
): Promise<QueryableConsts<"promise">> => {
  const api = await getApiPromise(config);

  return api.consts;
};

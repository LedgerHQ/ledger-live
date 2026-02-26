import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { type QueryableConsts } from "@polkadot/api/types";
import getApiPromise from "./apiPromise";

/**
 * Returns the blockchain's runtime constants.
 *
 * @async
 *
 * @returns {Promise<QueryableConsts<"promise">>}
 */
export const fetchConstants = async (
  currency?: CryptoCurrency,
): Promise<QueryableConsts<"promise">> => {
  const api = await getApiPromise(currency);

  return api.consts;
};

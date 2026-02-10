import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { decorateConstants } from "@polkadot/types";
import getApiPromise from "./apiPromise";

/**
 * Returns the blockchain's runtime constants.
 *
 * @async
 *
 * @returns {Object}
 */
export const fetchConstants = async (currency?: CryptoCurrency): Promise<Record<string, any>> => {
  const api = await getApiPromise(currency);

  const metadata = await api.rpc.state.getMetadata();
  const registry = api.registry;

  const consts = decorateConstants(registry, metadata.asLatest, metadata.version);

  return consts;
};

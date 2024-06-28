import { decorateConstants } from "@polkadot/types";
import getApiPromise from "./apiPromise";

/**
 * Returns the blockchain's runtime constants.
 *
 * @async
 *
 * @returns {Object}
 */
export const fetchConstants = async (): Promise<Record<string, any>> => {
  const api = await getApiPromise();

  const metadata = await api.rpc.state.getMetadata();
  const registry = api.registry;

  const consts = decorateConstants(registry, metadata.asLatest, metadata.version);

  return consts;
};

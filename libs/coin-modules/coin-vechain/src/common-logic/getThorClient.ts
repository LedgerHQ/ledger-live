import { ThorClient } from "@vechain/sdk-network";
import { VECHAIN_NODE_URL } from "../constants";

/**
 * Returns a ThorClient instance configured with the VeChain node URL
 * @returns {ThorClient} Configured ThorClient instance for interacting with the VeChain network
 */
export const getThorClient = (): ThorClient => {
  return ThorClient.at(VECHAIN_NODE_URL);
};

import { ThorClient } from "@vechain/sdk-network";
import { getNodeUrl } from "../config";

/**
 * Returns a ThorClient instance configured with the VeChain node URL
 * @returns {ThorClient} Configured ThorClient instance for interacting with the VeChain network
 */
export const getThorClient = (): ThorClient => {
  return ThorClient.at(getNodeUrl());
};

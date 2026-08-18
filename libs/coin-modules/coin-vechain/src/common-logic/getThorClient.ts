import { ThorClient } from "@vechain/sdk-network";
import { getNodeUrl, type VechainCurrencyConfig } from "../config";

/**
 * Returns a ThorClient instance configured with the VeChain node URL
 * @returns {ThorClient} Configured ThorClient instance for interacting with the VeChain network
 */
export const getThorClient = (config: VechainCurrencyConfig): ThorClient => {
  return ThorClient.at(getNodeUrl(config));
};

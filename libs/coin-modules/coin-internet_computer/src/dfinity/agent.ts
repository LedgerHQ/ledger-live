import { HttpAgent } from "@icp-sdk/core/agent";

/**
 * Creates and returns an HttpAgent instance for communicating with the IC network.
 *
 * @param host - The IC HTTP gateway host URL (e.g., "https://ic0.app")
 * @returns Promise resolving to an HttpAgent instance with fetched root key
 */
export const getAgent = async (host: string): Promise<HttpAgent> => {
  return await HttpAgent.create({ host, shouldFetchRootKey: true });
};

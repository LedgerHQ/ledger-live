import { ExplorerApi, NO_TOKEN } from "./types";

/**
 * Returns all operation types from an address
 * No explorer configured - returns empty results
 */
export const getLastOperations: ExplorerApi["getLastOperations"] = async () => {
  return {
    lastCoinOperations: [],
    lastTokenOperations: [],
    lastNftOperations: [],
    lastInternalOperations: [],
    nextPagingToken: NO_TOKEN,
  };
};

const noExplorerAPI: ExplorerApi = {
  getLastOperations,
};

export default noExplorerAPI;

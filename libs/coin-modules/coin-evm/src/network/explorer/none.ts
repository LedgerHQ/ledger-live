import { ExplorerApi, NO_TOKEN } from "./types";

/**
 * Returns all operation types from an address
 * No explorer configured - returns empty results
 */
export const getOperations: ExplorerApi["getOperations"] = async () => {
  return {
    lastCoinOperations: [],
    lastTokenOperations: [],
    lastNftOperations: [],
    lastInternalOperations: [],
    nextPagingToken: NO_TOKEN,
  };
};

/**
 * Returns all pending operation types from an address
 * No explorer configured - returns empty results
 */
export const getPendingOperations: ExplorerApi["getPendingOperations"] = async () => {
  return {
    lastCoinOperations: [],
    lastTokenOperations: [],
    lastNftOperations: [],
    lastInternalOperations: [],
    nextPagingToken: NO_TOKEN,
  };
};

const noExplorerAPI: ExplorerApi = {
  getOperations,
  getPendingOperations,
};

export default noExplorerAPI;

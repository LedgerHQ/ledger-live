import { ExplorerApi } from "./types";

/**
 * Returns all operation types from an address
 */
export const getLastOperations: ExplorerApi["getLastOperations"] = async () => {
  return {
    lastCoinOperations: [],
    lastTokenOperations: [],
    lastNftOperations: [],
    lastInternalOperations: [],
  };
};

const noExplorerAPI: ExplorerApi = {
  getLastOperations,
};

export default noExplorerAPI;

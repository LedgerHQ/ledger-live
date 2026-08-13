import { EvmConfigInfo } from "../../config";
import ledgerGasTracker from "./ledger";
import { GasTrackerApi } from "./types";

export const getGasTracker = (config: EvmConfigInfo): GasTrackerApi | null => {
  switch (config?.gasTracker?.type) {
    case "ledger":
      return ledgerGasTracker;

    /**
     * We return null instead of throwing an error because not having a gas tracker
     * is not necessarily an error.
     */
    default:
      return null;
  }
};

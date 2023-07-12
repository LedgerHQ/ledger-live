import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfig } from "../../logic";
import ledgerGasTracker from "./ledger";
import { GasTrackerApi } from "./types";

export const getGasTracker = async (currency: CryptoCurrency): Promise<GasTrackerApi | null> => {
  const { gasTracker } = await getCurrencyConfig(currency);
  switch (gasTracker?.type) {
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

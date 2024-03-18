import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import ledgerGasTracker from "./ledger";
import { GasTrackerApi } from "./types";

export const getGasTracker = (currency: CryptoCurrency): GasTrackerApi | null => {
  switch (currency.ethereumLikeInfo?.gasTracker?.type) {
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

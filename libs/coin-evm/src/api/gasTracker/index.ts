import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { GasOptions } from "../../types";
import { getGasOptions as ledgerGetGasOptions } from "./ledger";

type GasTrackerApi = {
  getGasOptions: ({
    currency,
    shouldUseEip1559,
  }: {
    currency: CryptoCurrency;
    shouldUseEip1559: boolean;
  }) => Promise<GasOptions>;
};

export const getGasTracker = (
  currency: CryptoCurrency
): GasTrackerApi | null => {
  switch (currency.ethereumLikeInfo?.gasTracker?.type) {
    case "ledger":
      return {
        getGasOptions: ledgerGetGasOptions,
      };

    /**
     * We return null instead of throwing an error because not having a gas tracker
     * is not necessarily an error.
     */
    default:
      return null;
  }
};

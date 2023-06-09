import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { GasOptions } from "../../types";
import { getGasOptions as ledgerGetGasOptions } from "./ledger";

type GasTrackerApi = {
  getGasOptions: (currency: CryptoCurrency) => Promise<GasOptions>;
};

export const getGasTracker = (currency: CryptoCurrency): GasTrackerApi => {
  switch (currency.ethereumLikeInfo?.gasTracker?.type) {
    case "ledger":
      return {
        getGasOptions: ledgerGetGasOptions,
      };

    default:
      throw new Error(`No gas tracker found for currency "${currency.id}"`);
  }
};

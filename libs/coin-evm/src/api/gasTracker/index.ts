import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { GasOptions } from "../../types";
import { getGasOptions as ledgerGetGasOptions } from "./ledger";

export const getGasTracker = (
  currency: CryptoCurrency
): {
  getGasOptions: (currency: CryptoCurrency) => Promise<GasOptions>;
} => {
  switch (currency.ethereumLikeInfo?.gasTracker?.type) {
    case "ledger":
      return {
        getGasOptions: ledgerGetGasOptions,
      };

    default:
      throw new Error(`No gas tracker found for currency "${currency.id}"`);
  }
};

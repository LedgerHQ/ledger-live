import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const getCurrencyConfig = (currency: CryptoCurrency): any => {
  switch (currency.id) {
    case "ethereum": {
      return {
        node: {},
      };
    }
  }
};

import { useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { selectInterestRateByCurrency } from "../entities/interestRateSelectors";
import { ApyType } from "../types/trend";
import { ApiState } from "../entities/selectorUtils";

const isValidApyType = (type: string): type is ApyType =>
  type === "NRR" || type === "APY" || type === "APR";

export const useInterestRatesByCurrencies = (currencies: CryptoOrTokenCurrency[]) => {
  return useSelector((state: ApiState) => {
    const rates: Record<string, { value: number; type: ApyType } | undefined> = {};
    for (const currency of currencies) {
      const apiRate = selectInterestRateByCurrency(state, currency.id);
      if (apiRate && isValidApyType(apiRate.type)) {
        rates[currency.id] = {
          value: apiRate.rate,
          type: apiRate.type,
        };
      }
    }
    return rates;
  });
};

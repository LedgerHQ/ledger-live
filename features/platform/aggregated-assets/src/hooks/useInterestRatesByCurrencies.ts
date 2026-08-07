import { useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import isEqual from "lodash/isEqual";
import { selectInterestRateByCurrency } from "../selectors/interestRateSelectors";
import type { Apy, ApyType } from "@domain/entity-interest-rate";
import { ApiState } from "../selectors/selectorUtils";

const isValidApyType = (type: string): type is ApyType =>
  type === "NRR" || type === "APY" || type === "APR";

export type InterestRatesByCurrencies = Record<string, Apy | undefined>;

export const useInterestRatesByCurrencies = (currencies: CryptoOrTokenCurrency[]) => {
  return useSelector((state: ApiState) => {
    const rates: InterestRatesByCurrencies = {};
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
  }, isEqual);
};

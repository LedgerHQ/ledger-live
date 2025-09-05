import { useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { selectInterestRateByCurrency } from "../data/entities/interestRateSelectors";
import { ApyType } from "../utils/type";

const isValidApyType = (type: string): type is ApyType =>
  type === "NRR" || type === "APY" || type === "APR";

export const useInterestRatesByCurrencies = (currencies: CryptoOrTokenCurrency[]) => {
  return useSelector(state => {
    const rates: Record<string, { value: number; type: ApyType } | undefined> = {};
    currencies.forEach(currency => {
      const apiRate = selectInterestRateByCurrency(state, currency.id);
      if (apiRate && isValidApyType(apiRate.type)) {
        rates[currency.id] = {
          value: apiRate.rate,
          type: apiRate.type,
        };
      }
    });
    return rates;
  });
};

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { selectInterestRateByCurrency } from "../entities/interestRateSelectors";
import { ApyType } from "../types/trend";
import { ApiState } from "../entities/selectorUtils";

const isValidApyType = (type: string): type is ApyType =>
  type === "NRR" || type === "APY" || type === "APR";

export const useInterestRatesByCurrencies = (currencies: CryptoOrTokenCurrency[]) => {
  const selectRates = useMemo(() => {
    return createSelector(
      [(state: ApiState) => state, (_state: ApiState, currs: CryptoOrTokenCurrency[]) => currs],
      (state, currs) => {
        const rates: Record<string, { value: number; type: ApyType } | undefined> = {};
        for (const currency of currs) {
          const apiRate = selectInterestRateByCurrency(state, currency.id);
          if (apiRate && isValidApyType(apiRate.type)) {
            rates[currency.id] = {
              value: apiRate.rate,
              type: apiRate.type,
            };
          }
        }
        return rates;
      },
    );
  }, []);

  return useSelector((state: ApiState) => selectRates(state, currencies));
};

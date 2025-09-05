import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { selectInterestRateByCurrency } from "../../data/entities/interestRateSelectors";
import { ApyType } from "../../utils/type";

const isValidApyType = (type: string): type is ApyType =>
  type === "NRR" || type === "APY" || type === "APR";

const createApyItem = ({
  value,
  type,
  ApyIndicator,
}: {
  value: number;
  type: ApyType;
  ApyIndicator: React.ComponentType<{ value: number; type: ApyType }>;
}) => <ApyIndicator value={value} type={type} />;

export const useLeftApyModule = (
  currencies: CryptoOrTokenCurrency[],
  ApyIndicator: React.ComponentType<{ value: number; type: ApyType }>,
) => {
  const interestRates = useSelector(state => {
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

  return useMemo(() => {
    return currencies.map(currency => {
      const interestRate = interestRates[currency.id];
      const interestRatePercentageRounded = interestRate
        ? Math.round(interestRate.value * 100 * 100) / 100
        : 0;

      if (!interestRate || interestRatePercentageRounded <= 0) {
        return currency;
      }

      return {
        ...currency,
        leftElement: createApyItem({
          value: interestRatePercentageRounded,
          type: interestRate.type,
          ApyIndicator,
        }),
      };
    });
  }, [currencies, interestRates, ApyIndicator]);
};

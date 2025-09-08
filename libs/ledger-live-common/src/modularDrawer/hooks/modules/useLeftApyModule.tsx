import React, { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ApyType } from "../../utils/type";
import { useInterestRatesByCurrencies } from "../useInterestRatesByCurrencies";
import { getInterestRateForAsset } from "../../utils/getInterestRateForAsset";

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
  const interestRates = useInterestRatesByCurrencies(currencies);

  return useMemo(() => {
    return currencies.map(currency => {
      const { interestRate, interestRatePercentageRounded } = getInterestRateForAsset(
        currency,
        interestRates,
      );

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

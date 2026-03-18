import React from "react";
import { AccountModuleParams, NetworkWithCount, NetworkConfigurationOptions } from "../utils/type";
import { useInterestRatesByCurrencies } from "../../dada-client/hooks/useInterestRatesByCurrencies";
import { getInterestRateForAsset } from "../utils/getInterestRateForAsset";

export function useLeftAccountsApyModule(
  params: AccountModuleParams,
  {
    useAccountData,
    accountsCountAndApy,
    ApyIndicator,
  }: Pick<NetworkConfigurationOptions, "useAccountData" | "accountsCountAndApy" | "ApyIndicator">,
): Array<NetworkWithCount> {
  const { networks } = params;
  const accountData = useAccountData(params);
  const interestRates = useInterestRatesByCurrencies(networks);

  return accountData.map(({ asset, label, count }) => {
    const { interestRate, interestRatePercentageRounded } = getInterestRateForAsset(
      asset,
      interestRates,
      networks,
    );

    if ((!interestRate || interestRatePercentageRounded <= 0) && count <= 0) {
      return {
        count,
      };
    }
    return {
      leftElement: accountsCountAndApy({
        label: count > 0 ? label : undefined,
        value: interestRatePercentageRounded,
        type: interestRate?.type,
      }),
      description: count > 0 ? label : undefined,
      apy:
        interestRate && interestRatePercentageRounded > 0 ? (
          <ApyIndicator value={interestRatePercentageRounded} type={interestRate.type} />
        ) : undefined,
      count,
    };
  });
}

import {
  AccountDataItem,
  AccountModuleParams,
  CreateAccountsCountAndApy,
  NetworkWithCount,
} from "../utils/type";
import { useInterestRatesByCurrencies } from "../../dada-client/hooks/useInterestRatesByCurrencies";
import { getInterestRateForAsset } from "../utils/getInterestRateForAsset";

export function useLeftAccountsApyModule(
  params: AccountModuleParams,
  useAccountData: (params: AccountModuleParams) => AccountDataItem[],
  accountsCountAndApy: CreateAccountsCountAndApy,
): Array<NetworkWithCount> {
  const { networks } = params;
  const accountData = useAccountData(params);
  const interestRates = useInterestRatesByCurrencies(networks);

  // Map each account to its APY info using the shared utility
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
      count,
    };
  });
}

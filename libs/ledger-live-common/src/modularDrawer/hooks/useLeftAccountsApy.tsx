import {
  AccountDataItem,
  AccountModuleParams,
  CreateAccountsCountAndApy,
  NetworkWithCount,
} from "../utils/type";

export const createUseLeftAccountsApyModule = ({
  useAccountData,
  accountsCountAndApy,
}: {
  useAccountData: (params: AccountModuleParams) => AccountDataItem[];
  accountsCountAndApy: CreateAccountsCountAndApy;
}) => {
  return function useLeftAccountsApyModule(params: AccountModuleParams): NetworkWithCount[] {
    const accountData = useAccountData(params);

    return accountData.map(({ asset, label, count }) => {
      const value = 5.11; // TODO to be retrieved from DADA
      const type = "APY"; // TODO to be retrieved from DADA
      return {
        ...asset,
        leftElement: count > 0 ? accountsCountAndApy({ label, value, type }) : undefined,
        count,
      };
    });
  };
};

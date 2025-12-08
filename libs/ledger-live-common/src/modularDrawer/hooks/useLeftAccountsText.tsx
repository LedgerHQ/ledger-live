import { AccountModuleParams, AccountDataItem, NetworkWithCount } from "../utils/type";

export const createUseLeftAccountsTextModule = ({
  useAccountData,
}: {
  useAccountData: (params: AccountModuleParams) => AccountDataItem[];
}) => {
  return function useLeftAccountsTextModule(params: AccountModuleParams): Array<NetworkWithCount> {
    const accountData = useAccountData(params);

    return accountData.map(({ label, count }) => ({
      description: count > 0 ? label : undefined,
      count,
    }));
  };
};

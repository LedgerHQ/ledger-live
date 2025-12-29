import { ReactNode } from "react";
import { AccountModuleParams, AccountDataItem, NetworkWithCount } from "../utils/type";

export const createUseLeftAccountsModule = ({
  useAccountData,
  accountsCount,
}: {
  useAccountData: (params: AccountModuleParams) => AccountDataItem[];
  accountsCount: (args: { label: string }) => ReactNode;
}) => {
  return function useLeftAccountsModule(params: AccountModuleParams): Array<NetworkWithCount> {
    const accountData = useAccountData(params);

    return accountData.map(({ label, count }) => ({
      leftElement: count > 0 ? accountsCount({ label }) : undefined,
      description: count > 0 ? label : undefined,
      count,
    }));
  };
};

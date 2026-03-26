import { AccountModuleParams, NetworkWithCount, NetworkConfigurationOptions } from "../utils/type";

export function useLeftAccountsModule(
  params: AccountModuleParams,
  {
    useAccountData,
    accountsCount,
  }: Pick<NetworkConfigurationOptions, "useAccountData" | "accountsCount">,
): Array<NetworkWithCount> {
  const accountData = useAccountData(params);

  return accountData.map(({ label, count }) => ({
    leftElement: count > 0 ? accountsCount({ label }) : undefined,
    description: count > 0 ? label : undefined,
    count,
  }));
}

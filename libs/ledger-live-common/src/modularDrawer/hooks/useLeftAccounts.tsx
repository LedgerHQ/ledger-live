import { ReactNode } from "react";
import { AccountModuleParams, AccountDataItem, NetworkWithCount } from "../utils/type";

export function useLeftAccountsModule({
  networks,
  useAccountData,
  accountsCount,
  enabled = true,
}: AccountModuleParams & {
  useAccountData: (params: AccountModuleParams) => AccountDataItem[];
  accountsCount: (args: { label: string }) => ReactNode;
  enabled?: boolean;
}): Array<NetworkWithCount> {
  const accountData = useAccountData({ networks });

  if (!enabled) return accountData.map(() => ({ count: 0 }));

  return accountData.map(({ label, count }) => ({
    leftElement: count > 0 ? accountsCount({ label }) : undefined,
    description: count > 0 ? label : undefined,
    count,
  }));
}

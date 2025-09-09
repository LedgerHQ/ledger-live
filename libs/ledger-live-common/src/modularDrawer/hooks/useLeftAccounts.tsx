import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ReactNode } from "react";
import { AccountModuleParams, AccountDataItem } from "../utils/type";

export const createUseLeftAccountsModule = ({
  useAccountData,
  accountsCount,
}: {
  useAccountData: (params: AccountModuleParams) => AccountDataItem[];
  accountsCount: (args: { label: string }) => ReactNode;
}) => {
  return function useLeftAccountsModule(
    params: AccountModuleParams,
  ): Array<CryptoOrTokenCurrency & { leftElement?: ReactNode; count: number }> {
    const accountData = useAccountData(params);

    return accountData.map(({ asset, label, count }) => ({
      ...asset,
      leftElement: count > 0 ? accountsCount({ label }) : undefined,
      count,
    }));
  };
};

import { AccountModuleParams } from "@ledgerhq/live-common/modularDrawer/utils/type";
import {
  NetworkCountItem,
  useNetworkAccountCounts,
} from "@ledgerhq/live-common/modularDrawer/hooks/useNetworkAccountCounts";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";

export const useAccountData = ({
  networks,
  accounts$,
}: AccountModuleParams): NetworkCountItem[] => {
  const { t } = useTranslation();
  const nestedAccounts = useSelector(accountsSelector);
  const accountIds = useGetAccountIds(accounts$);
  return useNetworkAccountCounts({
    networks,
    nestedAccounts,
    accountIds,
    formatLabel: (count: number) => t("modularAssetDrawer.accountCount", { count }),
  });
};

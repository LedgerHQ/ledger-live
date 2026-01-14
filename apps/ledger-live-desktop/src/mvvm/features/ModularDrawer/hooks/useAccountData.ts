import { AccountModuleParams } from "@ledgerhq/live-common/modularDrawer/utils/type";
import {
  NetworkCountItem,
  useNetworkAccountCounts,
} from "@ledgerhq/live-common/modularDrawer/hooks/useNetworkAccountCounts";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";

export const useAccountData = ({ networks }: AccountModuleParams): NetworkCountItem[] => {
  const { t } = useTranslation();
  const nestedAccounts = useSelector(accountsSelector);
  return useNetworkAccountCounts({
    networks,
    nestedAccounts,
    formatLabel: (count: number) => t("modularAssetDrawer.accountCount", { count }),
  });
};

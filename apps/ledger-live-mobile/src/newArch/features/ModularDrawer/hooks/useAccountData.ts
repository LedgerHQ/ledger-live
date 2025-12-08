import {
  NetworkCountItem,
  useNetworkAccountCounts,
} from "@ledgerhq/live-common/modularDrawer/hooks/useNetworkAccountCounts";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/reducers/accounts";

type AccountModuleParams = {
  networks: CryptoOrTokenCurrency[];
};

export const useAccountData = ({ networks }: AccountModuleParams): NetworkCountItem[] => {
  const { t } = useTranslation();
  const nestedAccounts = useSelector(accountsSelector);
  return useNetworkAccountCounts({
    networks,
    nestedAccounts,
    formatLabel: (count: number) => t("modularDrawer.accountCount", { count }),
  });
};

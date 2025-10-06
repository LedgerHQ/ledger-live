import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import {
  AssetCountItem,
  useAssetAccountCounts,
} from "@ledgerhq/live-common/modularDrawer/hooks/useAssetAccountCounts";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Observable } from "rxjs";
import { accountsSelector } from "~/reducers/accounts";

type AccountModuleParams = {
  networks: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

export const useAccountData = ({ networks, accounts$ }: AccountModuleParams): AssetCountItem[] => {
  const { t } = useTranslation();
  const nestedAccounts = useSelector(accountsSelector);
  const accountIds = useGetAccountIds(accounts$);
  return useAssetAccountCounts({
    networks,
    nestedAccounts,
    accountIds,
    formatLabel: (count: number) => t("modularDrawer.accountCount", { count }),
  });
};

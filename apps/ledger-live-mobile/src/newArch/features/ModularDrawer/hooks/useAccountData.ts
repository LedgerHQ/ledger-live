import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import {
  AssetCountItem,
  useAssetAccountCounts,
} from "@ledgerhq/live-common/modularDrawer/hooks/modules/useAssetAccountCounts";
import { useGetAccountIds } from "@ledgerhq/live-common/wallet-api/react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Observable } from "rxjs";
import { accountsSelector } from "~/reducers/accounts";

type AccountModuleParams = {
  assets: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

export const useAccountData = ({ assets, accounts$ }: AccountModuleParams): AssetCountItem[] => {
  const { t } = useTranslation();
  const nestedAccounts = useSelector(accountsSelector);
  const accountIds = useGetAccountIds(accounts$);
  return useAssetAccountCounts({
    assets,
    nestedAccounts,
    accountIds,
    formatLabel: (count: number) => t("modularDrawer.accountCount", { count }),
  });
};

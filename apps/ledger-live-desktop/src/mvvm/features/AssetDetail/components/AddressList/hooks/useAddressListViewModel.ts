import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike, DistributionItem } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useSortAccountsComparator } from "~/renderer/actions/general";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getAccountUrl } from "~/renderer/utils/accountUrl";
import { getAccountsSidebarPath } from "LLD/components/SideBar/utils";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDialog/analytics/modularDialog.types";
import { track } from "~/renderer/analytics/segment";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { buildMainAccountByIdMap } from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";

export function useAddressListViewModel(distributionItem: DistributionItem) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("desktop");
  const comparator = useSortAccountsComparator();
  const nestedAccounts = useSelector(accountsSelector);

  const accountById = useMemo(() => buildMainAccountByIdMap(nestedAccounts), [nestedAccounts]);

  const lookupParentAccount = useCallback(
    (id: string): Account | undefined | null => accountById.get(id) ?? null,
    [accountById],
  );

  const sortedAccounts = useMemo(() => {
    return [...distributionItem.accounts].sort(comparator);
  }, [distributionItem.accounts, comparator]);

  const { openAddAccountFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    MAD_SOURCE_PAGES.ASSET_DETAIL,
  );

  const onAddAddress = useCallback(() => {
    track("button_clicked", {
      button: "add_account",
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    openAddAccountFlow(distributionItem.currency);
  }, [distributionItem.currency, openAddAccountFlow]);

  const onAccountClick = useCallback(
    (account: AccountLike, parentAccount?: Account | null) => {
      setTrackingSource(ASSET_DETAIL_TRACKING_PAGE_NAME);
      track("account_clicked", {
        page: ASSET_DETAIL_TRACKING_PAGE_NAME,
        currency: getAccountCurrency(account).name,
        account: getDefaultAccountName(account),
      });
      if (account.type === "TokenAccount" && !parentAccount) {
        navigate(getAccountsSidebarPath(shouldDisplayAssetSection));
        return;
      }
      navigate(
        getAccountUrl(account.id, account.type === "TokenAccount" ? parentAccount?.id : undefined),
      );
    },
    [navigate, shouldDisplayAssetSection],
  );

  return {
    sortedAccounts,
    lookupParentAccount,
    onAddAddress,
    onAccountClick,
    sectionTitle: t("assetDetails.addresses"),
    sectionActionLabel: t("assetDetails.add"),
  };
}

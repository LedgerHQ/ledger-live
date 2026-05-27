import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike, DistributionItem } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
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
import { MAX_ADDRESSES_PREVIEW } from "../constants";

export function useAddressListViewModel(distributionItem: DistributionItem) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("desktop");
  const comparator = useSortAccountsComparator();
  const nestedAccounts = useSelector(accountsSelector);

  const accountById = useMemo(() => buildMainAccountByIdMap(nestedAccounts), [nestedAccounts]);

  const lookupParentAccount = (id: string): Account | undefined | null =>
    accountById.get(id) ?? null;

  const sortedAccounts = useMemo(() => {
    return [...distributionItem.accounts].sort(comparator);
  }, [distributionItem.accounts, comparator]);

  const addressCount = sortedAccounts.length;
  const shouldShowSeeAll = addressCount > MAX_ADDRESSES_PREVIEW;
  const previewAccounts = useMemo(
    () => (shouldShowSeeAll ? sortedAccounts.slice(0, MAX_ADDRESSES_PREVIEW) : sortedAccounts),
    [shouldShowSeeAll, sortedAccounts],
  );

  const [isAllAddressesDialogOpen, setIsAllAddressesDialogOpen] = useState(false);

  const onSeeAll = () => {
    setIsAllAddressesDialogOpen(true);
  };

  const onAllAddressesDialogOpenChange = (open: boolean) => {
    setIsAllAddressesDialogOpen(open);
  };

  const { openAddAccountFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    MAD_SOURCE_PAGES.ASSET_DETAIL,
  );

  const onAddAddress = () => {
    track("button_clicked", {
      button: "add_account",
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    openAddAccountFlow(distributionItem.currency);
  };

  const onAccountClick = (account: AccountLike, parentAccount?: Account | null) => {
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
  };

  const assetTicker = distributionItem.currency.ticker;

  return {
    previewAccounts,
    sortedAccounts,
    lookupParentAccount,
    onAddAddress,
    onAccountClick,
    sectionTitle: t("assetDetails.addresses"),
    sectionActionLabel: t("assetDetails.add"),
    addressCount,
    shouldShowSeeAll,
    onSeeAll,
    allAddressesDialog: {
      open: isAllAddressesDialogOpen,
      title: t("assetDetails.addressesDialog.title"),
      description: t("assetDetails.addressesDialog.description", { ticker: assetTicker }),
      onOpenChange: onAllAddressesDialogOpenChange,
    },
  };
}

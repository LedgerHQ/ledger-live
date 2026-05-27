import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { getAccountUrl } from "~/renderer/utils/accountUrl";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDialog/analytics/modularDialog.types";
import { getAccountsSidebarPath } from "LLD/components/SideBar/utils";
import type { CryptoAddressesViewModel } from "../types";
import { CRYPTO_TRACKING_PAGE_NAME } from "../constants";
import { useCryptoAccountRows } from "../components/Table/hooks/useCryptoAccountRows";
import { track } from "~/renderer/analytics/segment";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";

export default function useCryptoAddressesViewModel(): CryptoAddressesViewModel {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("desktop");
  const [searchValue, setSearchValue] = useState("");
  const { rows, lookupParentAccount } = useCryptoAccountRows(searchValue);

  const handleSearchChange = useCallback((value: string) => {
    track("search_query", { query: value, page: CRYPTO_TRACKING_PAGE_NAME });
    setSearchValue(value);
  }, []);

  const emptyTableMessage = useMemo(
    () =>
      searchValue.trim() === ""
        ? t("cryptoAddresses.table.emptyState")
        : t("cryptoAddresses.table.emptySearchState"),
    [searchValue, t],
  );

  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    MAD_SOURCE_PAGES.CRYPTOS_PAGE,
  );

  const onAddAddressClick = useCallback(() => {
    track("button_clicked", {
      button: "add_account",
      page: CRYPTO_TRACKING_PAGE_NAME,
    });
    openAssetFlow();
  }, [openAssetFlow]);

  const onAccountClick = useCallback(
    (account: AccountLike, parentAccount?: Account | null) => {
      setTrackingSource(CRYPTO_TRACKING_PAGE_NAME);
      track("account_clicked", {
        page: CRYPTO_TRACKING_PAGE_NAME,
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
    searchValue,
    setSearchValue: handleSearchChange,
    emptyTableMessage,
    onAddAddressClick,
    onAccountClick,
    rows,
    lookupParentAccount,
  };
}

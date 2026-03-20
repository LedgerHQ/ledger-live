import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { getAccountUrl } from "~/renderer/utils/accountUrl";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDrawer/analytics/modularDrawer.types";
import useAddAccountAnalytics from "LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics";
import { ADD_ACCOUNT_EVENTS_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { getAccountsSidebarPath } from "LLD/components/SideBar/utils";
import type { CryptoViewModel } from "../types";
import { CRYPTO_TRACKING_PAGE_NAME } from "../constants";
import { useCryptoAccountRows } from "../components/Table/hooks/useCryptoAccountRows";

export default function useCryptoViewModel(): CryptoViewModel {
  const navigate = useNavigate();
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("desktop");
  const [searchValue, setSearchValue] = useState("");
  const { rows, lookupParentAccount } = useCryptoAccountRows(searchValue);

  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    MAD_SOURCE_PAGES.CRYPTOS_PAGE,
  );
  const { trackAddAccountEvent } = useAddAccountAnalytics();

  const onAddAddressClick = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Add address",
      page: CRYPTO_TRACKING_PAGE_NAME,
    });
    openAssetFlow();
  }, [openAssetFlow, trackAddAccountEvent]);

  const onAccountClick = useCallback(
    (account: AccountLike, parentAccount?: Account | null) => {
      setTrackingSource("crypto page");
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
    setSearchValue,
    onAddAddressClick,
    onAccountClick,
    rows,
    lookupParentAccount,
  };
}

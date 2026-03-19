import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { getAccountUrl } from "~/renderer/utils/accountUrl";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDrawer/analytics/modularDrawer.types";
import useAddAccountAnalytics from "LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics";
import { ADD_ACCOUNT_EVENTS_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import type { CryptosViewModel } from "../types";
import { CRYPTO_TRACKING_PAGE_NAME } from "../constants";
import { useCryptosAccountRows } from "./useCryptosAccountRows";

export default function useCryptosViewModel(): CryptosViewModel {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const { rows, lookupParentAccount } = useCryptosAccountRows(searchValue);

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
      setTrackingSource("cryptos page");
      if (account.type === "TokenAccount" && !parentAccount) {
        navigate("/accounts");
        return;
      }
      navigate(
        getAccountUrl(account.id, account.type === "TokenAccount" ? parentAccount?.id : undefined),
      );
    },
    [navigate],
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

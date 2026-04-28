import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../../constants";

export type ExploreViewModel = {
  title: string;
  handleClick: () => void;
};

export function useExploreViewModel(): ExploreViewModel {
  const { t } = useTranslation();
  const url = useLocalizedUrl(urls.exploreLedgerDevices);

  const handleClick = useCallback(() => {
    openURL(url, "button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.exploreAllLedger,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  }, [url]);

  return {
    title: t("myWallet.explore"),
    handleClick,
  };
}

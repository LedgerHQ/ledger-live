import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";

export type ExploreViewModel = {
  title: string;
  handleClick: () => void;
};

export function useExploreViewModel(): ExploreViewModel {
  const { t } = useTranslation();
  const url = useLocalizedUrl(urls.exploreLedgerDevices);

  const handleClick = useCallback(() => {
    openURL(url, "button_clicked", {
      button: "explore all",
    });
  }, [url]);

  return {
    title: t("myWallet.explore"),
    handleClick,
  };
}

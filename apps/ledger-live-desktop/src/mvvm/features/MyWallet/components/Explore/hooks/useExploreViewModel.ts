import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLNSUpsellBannerModel } from "LLD/features/LNSUpsell";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../../constants";

type ProfileUpsell = {
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
};

type ExploreViewModel = {
  title: string;
  handleClick: () => void;
  upsell: ProfileUpsell | null;
};

export function useExploreViewModel(): ExploreViewModel {
  const { t } = useTranslation();
  const url = useLocalizedUrl(urls.exploreLedgerDevices);
  const { variant, discount, handleCTAClick, tracking } = useLNSUpsellBannerModel("profile");

  const handleClick = useCallback(() => {
    openURL(url, "button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.exploreAllLedger,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  }, [url]);

  const copyKey = tracking === "opted_out" ? "lnsUpsell.opted_out" : "lnsUpsell.profile";
  const upsell: ProfileUpsell | null =
    variant.type === "none"
      ? null
      : {
          title: t(`${copyKey}.title`),
          description: t(`${copyKey}.description`, { discount }),
          cta: t("lnsUpsell.profile.cta"),
          onClick: handleCTAClick,
        };

  return {
    title: t("myWallet.explore"),
    handleClick,
    upsell,
  };
}

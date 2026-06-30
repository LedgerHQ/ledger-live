import React from "react";
import { Banner } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

export function RobinhoodDisclaimerBannerView() {
  const { t } = useTranslation();

  return (
    <Banner
      appearance="info"
      title={t("assetDetails.robinhoodDisclaimerBanner.title")}
      data-testid="asset-detail-robinhood-disclaimer-banner"
    />
  );
}

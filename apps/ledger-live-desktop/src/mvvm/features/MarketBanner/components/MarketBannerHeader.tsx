import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-react";

type MarketBannerHeaderProps = {
  readonly onNavigate: () => void;
};

export const MarketBannerHeader = memo(function MarketBannerHeader({
  onNavigate,
}: MarketBannerHeaderProps) {
  const { t } = useTranslation();

  return (
    <Subheader>
      <SubheaderRow onClick={onNavigate} data-testid="market-banner-button">
        <SubheaderTitle>{t("marketBanner.title")}</SubheaderTitle>
        <SubheaderShowMore />
      </SubheaderRow>
    </Subheader>
  );
});

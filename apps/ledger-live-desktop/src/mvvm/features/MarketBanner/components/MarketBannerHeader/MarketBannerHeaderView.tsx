import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-react";
import { MarketBannerRankingSelect } from "../MarketBannerRankingSelect";

type MarketBannerHeaderViewProps = {
  readonly onNavigate: () => void;
};

export const MarketBannerHeaderView = memo(function MarketBannerHeaderView({
  onNavigate,
}: MarketBannerHeaderViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-12">
      <Subheader>
        <SubheaderRow onClick={onNavigate} data-testid="market-banner-button">
          <SubheaderTitle>{t("marketBanner.title")}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>
      <MarketBannerRankingSelect />
    </div>
  );
});

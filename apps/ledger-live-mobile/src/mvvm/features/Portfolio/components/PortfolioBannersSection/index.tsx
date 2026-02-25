import React from "react";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import { LNSUpsellBanner } from "LLM/features/LNSUpsell/components/LNSUpsellBanner";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";
import RecoverBanner from "~/components/RecoverBanner";

interface PortfolioBannersSectionProps {
  readonly isFirst: boolean;
  readonly isLNSUpsellBannerShown: boolean;
  readonly showAssets?: boolean;
}

export const PortfolioBannersSection = ({
  isFirst,
  isLNSUpsellBannerShown,
  showAssets,
}: PortfolioBannersSectionProps) => {
  return (
    <SectionContainer
      py="0"
      mt={6}
      isFirst={isFirst}
      key="BannersSection"
      testID="portfolio-banners-section"
    >
      {isLNSUpsellBannerShown && <LNSUpsellBanner location="wallet" mb={6} />}
      {!isLNSUpsellBannerShown && showAssets ? (
        <ContentCardsLocation
          key="contentCardsLocationPortfolio"
          locationId={ContentCardLocation.TopWallet}
          mb={6}
        />
      ) : null}
      <RecoverBanner mb={6} />
    </SectionContainer>
  );
};

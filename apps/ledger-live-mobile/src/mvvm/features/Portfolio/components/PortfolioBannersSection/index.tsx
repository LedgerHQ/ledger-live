import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import { LNSUpsellBanner } from "LLM/features/LNSUpsell/components/LNSUpsellBanner";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";
import RecoverBanner from "~/components/RecoverBanner";
import { OnboardingWidget } from "../OnboardingWidget";
import { usePortfolioBannersSectionViewModel } from "./usePortfolioBannersSectionViewModel";

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
  const { shouldShowOnboardingWidget, sectionMarginTop, hasAssets } =
    usePortfolioBannersSectionViewModel({
      isLNSUpsellBannerShown,
      showAssets,
    });

  return (
    <SectionContainer
      py="0"
      mt={0}
      isFirst={isFirst}
      key="BannersSection"
      testID="portfolio-banners-section"
    >
      <Box lx={{ marginTop: sectionMarginTop }}>
        {shouldShowOnboardingWidget ? (
          <Box lx={{ marginBottom: "s16" }}>
            <OnboardingWidget />
          </Box>
        ) : null}
        {isLNSUpsellBannerShown && <LNSUpsellBanner location="wallet" mx={6} mb={6} />}
        {!isLNSUpsellBannerShown && !shouldShowOnboardingWidget && hasAssets ? (
          <ContentCardsLocation
            key="contentCardsLocationPortfolio"
            locationId={ContentCardLocation.TopWallet}
          />
        ) : null}
        <RecoverBanner mb={6} />
      </Box>
    </SectionContainer>
  );
};

import React from "react";
import { Box } from "@ledgerhq/native-ui";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import { LNSUpsellBanner } from "LLM/features/LNSUpsell/components/LNSUpsellBanner";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";
import RecoverBanner from "~/components/RecoverBanner";
import OnboardingWidget from "../OnboardingWidget";
import { useOnboardingWidgetVisibility } from "../../hooks/useOnboardingWidgetVisibility";

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
  const isOnboardingWidgetVisible = useOnboardingWidgetVisibility();
  const shouldShowOnboardingWidget = isOnboardingWidgetVisible && !isLNSUpsellBannerShown;

  return (
    <SectionContainer
      py="0"
      mt={6}
      isFirst={isFirst}
      key="BannersSection"
      testID="portfolio-banners-section"
    >
      {shouldShowOnboardingWidget ? (
        <Box mb={6}>
          <OnboardingWidget />
        </Box>
      ) : null}
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

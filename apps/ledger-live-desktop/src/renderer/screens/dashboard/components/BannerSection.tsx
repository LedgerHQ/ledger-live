import React from "react";
import styled from "styled-components";
import ClearCacheBanner from "~/renderer/components/ClearCacheBanner";
import RecoverBanner from "~/renderer/components/RecoverBanner/RecoverBanner";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import { Box } from "@ledgerhq/react-ui/components/layout/index";
import { currenciesSelector } from "~/renderer/reducers/accounts";
import { useSelector } from "react-redux";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import useActionCards from "~/renderer/hooks/useActionCards";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { LNSUpsellBanner, useLNSUpsellBannerState } from "LLD/features/LNSUpsell";
import PortfolioContentCards from "LLD/features/DynamicContent/components/PortfolioContentCards";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

// This forces only one visible top banner at a time
export const TopBannerContainer = styled.div`
  z-index: 19;

  & > *:not(:first-child) {
    display: none;
  }
`;

export default function BannerSection() {
  const lldActionCarousel = useFeature("lldActionCarousel");
  const currencies = useSelector(currenciesSelector);

  const isPostOnboardingBannerVisible = usePostOnboardingEntryPointVisibleOnWallet();

  const { actionCards } = useActionCards();
  const isActionCardsCampainRunning = actionCards.length > 0;

  const isLNSUpsellBannerShown = useLNSUpsellBannerState("portfolio").isShown;

  return (
    <section>
      <TopBannerContainer>
        <ClearCacheBanner />
        <CurrencyDownStatusAlert currencies={currencies} hideStatusIncidents />
      </TopBannerContainer>
      <Box>
        {isPostOnboardingBannerVisible ? (
          <PostOnboardingHubBanner />
        ) : (
          <RecoverBanner>
            {isActionCardsCampainRunning && lldActionCarousel?.enabled ? (
              <ActionContentCards variant={ABTestingVariants.variantA} />
            ) : isLNSUpsellBannerShown ? (
              <LNSUpsellBanner location="portfolio" />
            ) : (
              <PortfolioContentCards />
            )}
          </RecoverBanner>
        )}
      </Box>
    </section>
  );
}

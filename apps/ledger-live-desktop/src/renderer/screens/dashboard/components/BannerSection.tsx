import React from "react";
import styled from "styled-components";
import ClearCacheBanner from "~/renderer/components/ClearCacheBanner";
import RecoverBanner from "~/renderer/components/RecoverBanner/RecoverBanner";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import { Box } from "@ledgerhq/react-ui/components/layout/index";
import { currenciesSelector } from "~/renderer/reducers/accounts";
import { useSelector } from "LLD/hooks/redux";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { LNSUpsellBanner } from "LLD/features/LNSUpsell";
import PortfolioContentCards from "LLD/features/DynamicContent/components/PortfolioContentCards";
import { useBannersVisibility } from "LLD/features/Portfolio/hooks/useBannersVisibility";

// This forces only one visible top banner at a time
export const TopBannerContainer = styled.div`
  z-index: 19;

  & > *:not(:first-child) {
    display: none;
  }
`;

export default function BannerSection({
  isWallet40Enabled = false,
}: {
  isWallet40Enabled?: boolean;
}) {
  const currencies = useSelector(currenciesSelector);

  const {
    isPostOnboardingBannerVisible,
    isActionCardsVisible,
    isLNSUpsellBannerVisible,
    hasAnyBannerVisible,
  } = useBannersVisibility();

  return (
    <section className={hasAnyBannerVisible && isWallet40Enabled ? "mb-32" : undefined}>
      <TopBannerContainer>
        <ClearCacheBanner />
        <CurrencyDownStatusAlert currencies={currencies} hideStatusIncidents />
      </TopBannerContainer>
      <Box>
        {isPostOnboardingBannerVisible ? (
          <PostOnboardingHubBanner />
        ) : (
          <RecoverBanner>
            {isActionCardsVisible ? (
              <ActionContentCards variant={ABTestingVariants.variantA} />
            ) : isLNSUpsellBannerVisible ? (
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

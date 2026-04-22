import React, { memo } from "react";
import RecoverBanner from "~/renderer/components/RecoverBanner/RecoverBanner";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { LNSUpsellBanner } from "LLD/features/LNSUpsell";
import PortfolioContentCards from "LLD/features/DynamicContent/components/PortfolioContentCards";
import { useBannersVisibility } from "../hooks/useBannersVisibility";

/**
 * Renders the portfolio banner block: post-onboarding hub banner
 * or recover banner with action cards / LNS upsell / portfolio content cards.
 * Used in PortfolioView (above MarketBanner) and in BannerSection (legacy dashboard).
 */
export const PortfolioBannerContent = memo(function PortfolioBannerContent() {
  const { isPostOnboardingBannerVisible, isActionCardsVisible, isLNSUpsellBannerVisible } =
    useBannersVisibility();

  if (isPostOnboardingBannerVisible) {
    return <PostOnboardingHubBanner />;
  }

  return (
    <RecoverBanner>
      {isActionCardsVisible ? (
        <ActionContentCards variant={ABTestingVariants.variantA} />
      ) : isLNSUpsellBannerVisible ? (
        <LNSUpsellBanner location="portfolio" />
      ) : (
        <PortfolioContentCards />
      )}
    </RecoverBanner>
  );
});

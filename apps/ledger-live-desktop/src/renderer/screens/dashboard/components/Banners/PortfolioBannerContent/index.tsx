import React, { memo } from "react";
import { ABTestingVariants } from "@ledgerhq/types-live";
import PortfolioContentCards from "LLD/features/DynamicContent/components/PortfolioContentCards";
import FinishOnboardingWidget from "LLD/features/FinishOnboardingWidget";
import { LNSUpsellBanner } from "LLD/features/LNSUpsell";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import RecoverBanner from "~/renderer/components/RecoverBanner/RecoverBanner";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { useBannersVisibility } from "../hooks/useBannersVisibility";

/**
 * Renders the portfolio banner block. Order of evaluation (first match wins):
 * 1. LNS upsell (e.g. Nano S), when shown by `useLNSUpsellBannerState`.
 * 2. Wallet40 finish-onboarding widget, when shown by `usePostOnboardingPortfolioWidgetVisibility`.
 * 3. Legacy post-onboarding hub when the wallet entry point is visible and the Wallet40
 *    finish-onboarding widget is off.
 * 4. Recover banner with action cards or portfolio content cards.
 *
 * Used in PortfolioView (above MarketBanner) and in BannerSection (legacy dashboard).
 */
export const PortfolioBannerContent = memo(function PortfolioBannerContent() {
  const {
    isPostOnboardingBannerVisible,
    isFinishOnboardingWidgetVisible,
    isActionCardsVisible,
    isLNSUpsellBannerVisible,
  } = useBannersVisibility();

  if (isLNSUpsellBannerVisible) {
    return <LNSUpsellBanner location="portfolio" />;
  }

  if (isFinishOnboardingWidgetVisible) {
    return <FinishOnboardingWidget />;
  }

  if (isPostOnboardingBannerVisible) {
    return <PostOnboardingHubBanner />;
  }

  return (
    <RecoverBanner>
      {isActionCardsVisible ? (
        <ActionContentCards variant={ABTestingVariants.variantA} />
      ) : (
        <PortfolioContentCards />
      )}
    </RecoverBanner>
  );
});

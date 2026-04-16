import React, { memo } from "react";
import RecoverBanner from "~/renderer/components/RecoverBanner/RecoverBanner";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { LNSUpsellBanner } from "LLD/features/LNSUpsell";
import PortfolioContentCards from "LLD/features/DynamicContent/components/PortfolioContentCards";
import { useBannersVisibility } from "../hooks/useBannersVisibility";

/**
 * Renders the portfolio banner block. Order of evaluation (first match wins):
 * 1. Legacy post-onboarding hub when the wallet entry point is visible and the Wallet40
 *    finish-onboarding widget is off.
 * 2. LNS upsell (e.g. Nano S), when shown by `useLNSUpsellBannerState`.
 * 3. Wallet40 finish-onboarding widget slot (currently `null` until LIVE-26394).
 * 4. Recover banner with action cards or portfolio content cards.
 *
 * Used in PortfolioView (above MarketBanner) and in BannerSection (legacy dashboard).
 */
export const PortfolioBannerContent = memo(function PortfolioBannerContent() {
  const { isPostOnboardingBannerVisible, isFinishOnboardingWidgetVisible, isActionCardsVisible, isLNSUpsellBannerVisible } =
    useBannersVisibility();

  if (isPostOnboardingBannerVisible && !isFinishOnboardingWidgetVisible) {
    return <PostOnboardingHubBanner />;
  }

  if (isLNSUpsellBannerVisible) {
    return <LNSUpsellBanner location="portfolio" />;
  }

  if (isFinishOnboardingWidgetVisible) {
    /*
     * INTEGRATION — Finish Onboarding widget (LIVE-26394 / technical plan):
     * Replace this `null` with the new compact card (Lumen Stepper X/Y, title/subtitle,
     * opens checklist dialog). Visibility + flag: isFinishOnboardingWidgetVisible →
     * useBannersVisibility / usePostOnboardingPortfolioWidgetVisibility.
     * Suggested location: apps/ledger-live-desktop/src/mvvm/features/FinishOnboardingWidget/ (MVVM).
     */
    return null;
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

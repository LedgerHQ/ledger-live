import React, { memo } from "react";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import PortfolioContentCards from "LLD/features/DynamicContent/components/PortfolioContentCards";
import FinishOnboardingWidget from "LLD/features/FinishOnboarding/FinishOnboardingWidget";
import RecoverWidget from "LLD/features/FinishOnboarding/RecoverWidget";
import { useRecoverWidgetViewModel } from "LLD/features/FinishOnboarding/RecoverWidget/useRecoverWidgetViewModel";
import { LNSUpsellBanner } from "LLD/features/LNSUpsell";
import shouldDisplayRecoverBannerFromStore from "LLD/features/Portfolio/utils/shouldDisplayRecoverBannerFromStore";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import RecoverBanner from "~/renderer/components/RecoverBanner/RecoverBanner";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { useBannersVisibility } from "../hooks/useBannersVisibility";

/**
 * Renders the portfolio banner block above the portfolio carousel / market banner.
 *
 * **Wallet40** (`shouldDisplayFinishOnboardingWidget`):
 * - LNS upsell when `isLNSUpsellBannerVisible`.
 * - Finish onboarding and/or Recover widgets in a row when either applies.
 * - Otherwise `RecoverBanner` (passthrough / Recover UX) wrapping `PortfolioContentCards`.
 *
 * **Legacy** (Wallet40 off):
 * - Post-onboarding hub: `RecoverBanner` wrapping `PostOnboardingHubBanner` when the wallet entry
 *   point is visible.
 * - Otherwise `RecoverBanner` with action cards, LNS upsell, or `PortfolioContentCards`.
 *
 * Recover in the Wallet40 row uses `shouldDisplayRecoverBannerFromStore` and
 * `useRecoverWidgetViewModel().isVisible` so the row is not empty when `RecoverWidget` would not render.
 *
 * Used in PortfolioView (above MarketBanner) and in BannerSection (legacy dashboard).
 */
export const PortfolioBannerContent = memo(function PortfolioBannerContent() {
  const {
    isPostOnboardingBannerVisible,
    isFinishOnboardingWidgetVisible,
    isActionCardsVisible,
    isLNSUpsellBannerVisible,
    shouldDisplayFinishOnboardingWidget,
  } = useBannersVisibility();
  const recoverServices = useFeature("protectServicesDesktop");
  const recoverProtectId = recoverServices?.params?.protectId ?? "protect-prod";
  const { isVisible: isRecoverWidgetOfferVisible } = useRecoverWidgetViewModel();
  const shouldDisplayRecover =
    shouldDisplayRecoverBannerFromStore(recoverProtectId) && isRecoverWidgetOfferVisible;

  if (shouldDisplayFinishOnboardingWidget) {
    if (isLNSUpsellBannerVisible) {
      return <LNSUpsellBanner location="portfolio" />;
    }
    if (isFinishOnboardingWidgetVisible || shouldDisplayRecover) {
      return (
        <div className="flex w-full gap-12">
          {isFinishOnboardingWidgetVisible && <FinishOnboardingWidget />}
          {shouldDisplayRecover && <RecoverWidget />}
        </div>
      );
    }
    return <PortfolioContentCards />;
  }

  if (isPostOnboardingBannerVisible) {
    return <PostOnboardingHubBanner />;
  }

  let recoverBannerChildren: React.ReactNode;
  if (isActionCardsVisible) {
    recoverBannerChildren = <ActionContentCards variant={ABTestingVariants.variantA} />;
  } else if (isLNSUpsellBannerVisible) {
    recoverBannerChildren = <LNSUpsellBanner location="portfolio" />;
  } else {
    recoverBannerChildren = <PortfolioContentCards />;
  }

  return <RecoverBanner>{recoverBannerChildren}</RecoverBanner>;
});

import React, { memo } from "react";
import { ABTestingVariants } from "@ledgerhq/types-live";
import PortfolioContentCards from "LLD/features/DynamicContent/components/PortfolioContentCards";
import FinishOnboardingWidget from "LLD/features/FinishOnboarding/FinishOnboardingWidget";
import RecoverWidgetView from "LLD/features/FinishOnboarding/RecoverWidget/RecoverWidgetView";
import { useRecoverWidgetViewModel } from "LLD/features/FinishOnboarding/RecoverWidget/useRecoverWidgetViewModel";
import { LNSUpsellBanner } from "LLD/features/LNSUpsell";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import RecoverBanner from "~/renderer/components/RecoverBanner/RecoverBanner";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { useBannersVisibility } from "../hooks/useBannersVisibility";

/**
 * Wallet40 row without LNS priority: runs `useRecoverWidgetViewModel` only when this subtree mounts
 * (parent renders LNS upsell first when `isLNSUpsellBannerVisible`, so Recover hooks do not run there).
 */
const PortfolioBannerWallet40 = memo(function PortfolioBannerWallet40({
  isFinishOnboardingWidgetVisible,
}: {
  isFinishOnboardingWidgetVisible: boolean;
}) {
  const recoverVm = useRecoverWidgetViewModel();
  const { shouldDisplayRecoverInPortfolioBannerRow } = recoverVm;

  if (isFinishOnboardingWidgetVisible || shouldDisplayRecoverInPortfolioBannerRow) {
    return (
      <div className="flex w-full gap-12">
        {isFinishOnboardingWidgetVisible && <FinishOnboardingWidget />}
        {shouldDisplayRecoverInPortfolioBannerRow && (
          <RecoverWidgetView
            isVisible={recoverVm.isVisible}
            titleKey={recoverVm.titleKey}
            descriptionKey={recoverVm.descriptionKey}
            onOpenRecover={recoverVm.onOpenRecover}
          />
        )}
      </div>
    );
  }
  return <PortfolioContentCards />;
});

/**
 * Renders the portfolio banner block above the portfolio carousel / market banner.
 *
 * **Wallet40** (`shouldDisplayFinishOnboardingWidget`):
 * - LNS upsell when `isLNSUpsellBannerVisible`.
 * - Finish onboarding and/or Recover widgets in a row when either applies.
 * - Otherwise `PortfolioContentCards` directly (via `PortfolioBannerWallet40`).
 *
 * **Legacy** (Wallet40 off):
 * - Post-onboarding hub: `PostOnboardingHubBanner` is rendered directly when the wallet entry point
 *   is visible.
 * - Otherwise `RecoverBanner` wraps action cards, LNS upsell, or `PortfolioContentCards`.
 *
 * When Wallet40 applies and LNS upsell is visible, LNS is rendered here without mounting the Recover
 * subtree. Otherwise the finish/recover row uses one `useRecoverWidgetViewModel` (→ `useRecoverBannerState`,
 * LIVE-30279) and `shouldDisplayRecoverInPortfolioBannerRow`; the same view-model props are passed to
 * `RecoverWidgetView` so hooks are not duplicated when the Recover tile is shown.
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

  if (shouldDisplayFinishOnboardingWidget) {
    if (isLNSUpsellBannerVisible) {
      return <LNSUpsellBanner location="portfolio" />;
    }
    return (
      <PortfolioBannerWallet40 isFinishOnboardingWidgetVisible={isFinishOnboardingWidgetVisible} />
    );
  }

  if (isPostOnboardingBannerVisible) {
    return <PostOnboardingHubBanner />;
  }

  let recoverBannerChildren: React.ReactNode = <PortfolioContentCards />;

  if (isActionCardsVisible) {
    recoverBannerChildren = <ActionContentCards variant={ABTestingVariants.variantA} />;
  } else if (isLNSUpsellBannerVisible) {
    recoverBannerChildren = <LNSUpsellBanner location="portfolio" />;
  }

  return <RecoverBanner>{recoverBannerChildren}</RecoverBanner>;
});

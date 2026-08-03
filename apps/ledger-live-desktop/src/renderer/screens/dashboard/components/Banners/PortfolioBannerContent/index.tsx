import React, { memo, type ReactNode } from "react";
import PortfolioContentCards from "LLD/features/DynamicContent/components/PortfolioContentCards";
import FinishOnboardingWidget from "LLD/features/FinishOnboarding/FinishOnboardingWidget";
import RecoverWidgetView from "LLD/features/FinishOnboarding/RecoverWidget/RecoverWidgetView";
import { usePortfolioAddRecoverPostOnboardingAction } from "LLD/features/FinishOnboarding/RecoverWidget/usePortfolioAddRecoverPostOnboardingAction";
import {
  useRecoverWidgetViewModel,
  type RecoverWidgetViewProps,
} from "LLD/features/FinishOnboarding/RecoverWidget/useRecoverWidgetViewModel";
import { LNSUpsellBanner } from "LLD/features/LNSUpsell";
import PostOnboardingHubBanner from "~/renderer/components/PostOnboardingHub/PostOnboardingHubBanner";
import RecoverBanner from "~/renderer/components/RecoverBanner/RecoverBanner";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { useBannersVisibility } from "../hooks/useBannersVisibility";

/**
 * Wallet40 row: Finish/Recover widgets take priority over Braze cards.
 * When LNS upsell is eligible and Finish/Recover are showing, LNS remains exclusive.
 * When falling through to Braze cards, LNS is prepended as the leading slide / grid slot.
 */
const PortfolioBannerWallet40 = memo(function PortfolioBannerWallet40({
  isFinishOnboardingWidgetVisible,
  lnsUpsellLeadingSlide,
  recoverWidget,
}: {
  isFinishOnboardingWidgetVisible: boolean;
  lnsUpsellLeadingSlide?: ReactNode;
  recoverWidget: RecoverWidgetViewProps;
}) {
  const {
    shouldDisplay: shouldDisplayRecoverWidget,
    titleKey,
    descriptionKey,
    onOpenRecover,
  } = recoverWidget;

  if (isFinishOnboardingWidgetVisible || shouldDisplayRecoverWidget) {
    return (
      <div className="flex w-full gap-12">
        {isFinishOnboardingWidgetVisible && <FinishOnboardingWidget />}
        {shouldDisplayRecoverWidget && (
          <RecoverWidgetView
            shouldDisplay
            titleKey={titleKey}
            descriptionKey={descriptionKey}
            onOpenRecover={onOpenRecover}
          />
        )}
      </div>
    );
  }
  return <PortfolioContentCards leadingSlide={lnsUpsellLeadingSlide} />;
});

/**
 * Renders the portfolio banner block above the portfolio carousel / market banner.
 *
 * **Wallet40** (`shouldDisplayFinishOnboardingWidget`):
 * - Finish onboarding and/or Recover widgets when either applies (LNS upsell still exclusive over them).
 * - Otherwise `PortfolioContentCards`, with LNS upsell as leading carousel slide when eligible.
 *
 * **Legacy** (Wallet40 off):
 * - Post-onboarding hub: `PostOnboardingHubBanner` is rendered directly when the wallet entry point
 *   is visible.
 * - Otherwise `RecoverBanner` wraps action cards, or `PortfolioContentCards` (LNS as leading slide).
 *
 * The Recover post-onboarding action-append runs here via `usePortfolioAddRecoverPostOnboardingAction`,
 * which is decoupled from the Recover widget render path so the hub still receives Recover when
 * the LNS upsell is rendered instead of the finish/recover row.
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

  usePortfolioAddRecoverPostOnboardingAction();

  // Lifted so Wallet40 is not mounted when LNS is exclusive over Finish/Recover.
  const recoverWidget = useRecoverWidgetViewModel();

  const lnsUpsellLeadingSlide = isLNSUpsellBannerVisible ? (
    <LNSUpsellBanner location="portfolio" />
  ) : undefined;

  if (shouldDisplayFinishOnboardingWidget) {
    if (
      isLNSUpsellBannerVisible &&
      (isFinishOnboardingWidgetVisible || recoverWidget.shouldDisplay)
    ) {
      return <>{lnsUpsellLeadingSlide}</>;
    }
    return (
      <PortfolioBannerWallet40
        isFinishOnboardingWidgetVisible={isFinishOnboardingWidgetVisible}
        lnsUpsellLeadingSlide={lnsUpsellLeadingSlide}
        recoverWidget={recoverWidget}
      />
    );
  }

  if (isPostOnboardingBannerVisible) {
    return <PostOnboardingHubBanner />;
  }

  let recoverBannerChildren: ReactNode = (
    <PortfolioContentCards leadingSlide={lnsUpsellLeadingSlide} />
  );

  if (isActionCardsVisible) {
    recoverBannerChildren = <ActionContentCards />;
  }

  return <RecoverBanner>{recoverBannerChildren}</RecoverBanner>;
});

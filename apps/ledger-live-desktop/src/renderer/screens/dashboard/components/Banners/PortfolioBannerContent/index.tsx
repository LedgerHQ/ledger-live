import React, { memo, type ReactNode } from "react";
import PortfolioCategoryContentCards from "LLD/features/DynamicContent/components/PortfolioCategoryContentCards";
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

type PortfolioBannerStackProps = Readonly<{
  topContent?: ReactNode;
  lnsUpsellBanner?: ReactNode;
  categoryLeadingSlide?: ReactNode;
}>;

function PortfolioBannerStack({
  topContent,
  lnsUpsellBanner,
  categoryLeadingSlide,
}: PortfolioBannerStackProps) {
  return (
    <div className="flex w-full flex-col gap-16">
      {topContent}
      {lnsUpsellBanner}
      <PortfolioCategoryContentCards leadingSlide={categoryLeadingSlide} />
    </div>
  );
}

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

  const hasPriorityWidgets = isFinishOnboardingWidgetVisible || shouldDisplayRecoverWidget;

  if (!hasPriorityWidgets) {
    return <PortfolioCategoryContentCards leadingSlide={lnsUpsellLeadingSlide} />;
  }

  return (
    <PortfolioBannerStack
      topContent={
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
      }
    />
  );
});

export const PortfolioBannerContent = memo(function PortfolioBannerContent() {
  const {
    isPostOnboardingBannerVisible,
    isFinishOnboardingWidgetVisible,
    isActionCardsVisible,
    isLNSUpsellBannerVisible,
    shouldDisplayFinishOnboardingWidget,
  } = useBannersVisibility();

  usePortfolioAddRecoverPostOnboardingAction();

  const recoverWidget = useRecoverWidgetViewModel();

  const lnsUpsellLeadingSlide = isLNSUpsellBannerVisible ? (
    <LNSUpsellBanner location="portfolio" />
  ) : undefined;

  if (shouldDisplayFinishOnboardingWidget) {
    if (
      isLNSUpsellBannerVisible &&
      (isFinishOnboardingWidgetVisible || recoverWidget.shouldDisplay)
    ) {
      return <PortfolioBannerStack lnsUpsellBanner={lnsUpsellLeadingSlide} />;
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

  if (isActionCardsVisible) {
    return (
      <RecoverBanner>
        <PortfolioBannerStack topContent={<ActionContentCards />} />
      </RecoverBanner>
    );
  }

  return (
    <RecoverBanner>
      <PortfolioCategoryContentCards leadingSlide={lnsUpsellLeadingSlide} />
    </RecoverBanner>
  );
});

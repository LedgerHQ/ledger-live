import { useSelector } from "LLD/hooks/redux";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { usePostOnboardingEntryPointVisibleOnWallet, usePostOnboardingPortfolioWidgetVisibility } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { showClearCacheBannerSelector } from "~/renderer/reducers/settings";
import { portfolioContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell";
import useActionCards from "~/renderer/hooks/useActionCards";

interface BannerVisibilityState {
  /** True if the clear cache banner is visible */
  isClearCacheBannerVisible: boolean;
  /** True if the post-onboarding banner is visible */
  isPostOnboardingBannerVisible: boolean;
  /** True if the Finish Onboarding widget (post-onboarding entry) should show on Portfolio */
  isFinishOnboardingWidgetVisible: boolean;
  /** True if the action cards carousel is visible */
  isActionCardsVisible: boolean;
  /** True if the LNS upsell banner is visible */
  isLNSUpsellBannerVisible: boolean;
  /** True if portfolio (top) content cards are visible */
  isPortfolioContentCardsVisible: boolean;
  /** True if at least one banner or content card is visible */
  hasAnyContentBannerVisible: boolean;
}

/**
 * Hook to determine the visibility state of portfolio banners.
 * Returns individual banner visibility states and a combined flag
 * indicating if at least one banner is displayed.
 */
export function useBannersVisibility(): BannerVisibilityState {
  const lldActionCarousel = useFeature("lldActionCarousel");
  const { shouldDisplayFinishOnboardingWidget = false } = useWalletFeaturesConfig("desktop");

  // Clear cache banner
  const isClearCacheBannerVisible: boolean = useSelector(showClearCacheBannerSelector);

  // Post-onboarding banner
  const isPostOnboardingBannerVisible = usePostOnboardingEntryPointVisibleOnWallet();

  // Finish onboarding widget
  const { isPortfolioWidgetBaseVisible } = usePostOnboardingPortfolioWidgetVisibility(
    flattenAccountsSelector,
  );
  const isFinishOnboardingWidgetVisible =
    isPortfolioWidgetBaseVisible && shouldDisplayFinishOnboardingWidget;

  // Action cards carousel
  const { actionCards } = useActionCards();
  const isActionCardsCampaignRunning = actionCards.length > 0;
  const isActionCardsVisible = isActionCardsCampaignRunning && Boolean(lldActionCarousel?.enabled);

  // LNS upsell banner
  const isLNSUpsellBannerVisible = useLNSUpsellBannerState("portfolio").isShown;

  // Portfolio (top) content cards carousel
  const portfolioCards = useSelector(portfolioContentCardSelector);
  const isPortfolioContentCardsVisible = portfolioCards.length > 0;

  // Combined check: at least one banner or content card is visible

  const hasAnyContentBannerVisible =
    isPostOnboardingBannerVisible ||
    isFinishOnboardingWidgetVisible ||
    isActionCardsVisible ||
    isLNSUpsellBannerVisible ||
    isPortfolioContentCardsVisible;

  return {
    isClearCacheBannerVisible,
    isPostOnboardingBannerVisible,
    isFinishOnboardingWidgetVisible,
    isActionCardsVisible,
    isLNSUpsellBannerVisible,
    isPortfolioContentCardsVisible,
    hasAnyContentBannerVisible,
  };
}

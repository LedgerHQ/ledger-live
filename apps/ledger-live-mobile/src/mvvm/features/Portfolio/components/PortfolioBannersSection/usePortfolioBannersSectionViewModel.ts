import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useTopWalletHasDisplayableContentCards } from "~/dynamicContent/useTopWalletHasDisplayableContentCards";
import { useOnboardingWidgetVisibility } from "../../hooks/useOnboardingWidgetVisibility";

interface PortfolioBannersSectionViewModelParams {
  readonly isLNSUpsellBannerShown: boolean;
  readonly showAssets?: boolean;
}

interface PortfolioBannersSectionViewModelResult {
  readonly shouldShowOnboardingWidget: boolean;
  readonly sectionMarginTop: "s12" | "s16" | "s32";
  readonly hasAssets: boolean;
}

export const usePortfolioBannersSectionViewModel = ({
  isLNSUpsellBannerShown,
  showAssets,
}: PortfolioBannersSectionViewModelParams): PortfolioBannersSectionViewModelResult => {
  const { shouldDisplayQuickActionCtas } = useWalletFeaturesConfig("mobile");
  const hasTopWalletDisplayableCards = useTopWalletHasDisplayableContentCards();
  const isOnboardingWidgetVisible = useOnboardingWidgetVisibility();
  const shouldShowOnboardingWidget = isOnboardingWidgetVisible && !isLNSUpsellBannerShown;

  const hasAssets = showAssets === true;

  let sectionMarginTop: PortfolioBannersSectionViewModelResult["sectionMarginTop"] = "s32";
  if (!shouldDisplayQuickActionCtas || !hasAssets) {
    sectionMarginTop = "s16";
  } else if (hasTopWalletDisplayableCards) {
    sectionMarginTop = "s12";
  }

  return { shouldShowOnboardingWidget, sectionMarginTop, hasAssets };
};

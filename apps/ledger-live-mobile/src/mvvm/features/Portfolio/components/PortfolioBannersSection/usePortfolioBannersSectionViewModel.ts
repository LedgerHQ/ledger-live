import { useOnboardingWidgetVisibility } from "../../hooks/useOnboardingWidgetVisibility";

interface PortfolioBannersSectionViewModelParams {
  readonly isLNSUpsellBannerShown: boolean;
}

interface PortfolioBannersSectionViewModelResult {
  readonly shouldShowOnboardingWidget: boolean;
}

export const usePortfolioBannersSectionViewModel = ({
  isLNSUpsellBannerShown,
}: PortfolioBannersSectionViewModelParams): PortfolioBannersSectionViewModelResult => {
  const isOnboardingWidgetVisible = useOnboardingWidgetVisibility();
  const shouldShowOnboardingWidget = isOnboardingWidgetVisible && !isLNSUpsellBannerShown;

  return { shouldShowOnboardingWidget };
};

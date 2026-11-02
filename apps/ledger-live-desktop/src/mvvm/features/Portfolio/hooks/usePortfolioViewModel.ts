import { useMemo } from "react";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import uniq from "lodash/uniq";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { showClearCacheBannerSelector } from "~/renderer/reducers/settings";
import { useServicesEntryPointsFeature } from "@features/flow-portfolio-services-entry-points";
import { useBorrowLiveConfig } from "LLD/features/Borrow/hooks/useBorrowLiveConfig";
import { useResumeAddAccountAfterOnboarding } from "./useResumeAddAccountAfterOnboarding";

export interface PortfolioViewModelResult {
  readonly totalAccounts: number;
  readonly totalOperations: number;
  readonly totalCurrencies: number;
  readonly hasExchangeBannerCTA: boolean;
  readonly shouldDisplayBorrowSection: boolean;
  readonly shouldDisplayPerpsEntryPoint: boolean;
  readonly shouldDisplayServicesEntryPoints: boolean;
  readonly shouldDisplayBrazePlacement: boolean;
  readonly t: TFunction;
  readonly isClearCacheBannerVisible: boolean;
}

export const usePortfolioViewModel = (): PortfolioViewModelResult => {
  const accounts = useSelector(accountsSelector);
  const portfolioExchangeBanner = useFeature("portfolioExchangeBanner");

  // Resume the Add Account flow that was interrupted to send the user through device onboarding.
  useResumeAddAccountAfterOnboarding();

  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("desktop");
  const borrowConfig = useBorrowLiveConfig();
  const { isEnabled: shouldDisplayServicesEntryPoints } = useServicesEntryPointsFeature();
  const shouldDisplayBorrowSection =
    (borrowConfig?.enabled ?? false) && !shouldDisplayServicesEntryPoints;
  const { t } = useTranslation();

  const totalAccounts = accounts.length;

  const totalCurrencies = useMemo(() => uniq(accounts.map(a => a.currency.id)).length, [accounts]);

  const totalOperations = useMemo(
    () => accounts.reduce((sum, a) => sum + a.operations.length, 0),
    [accounts],
  );

  const hasExchangeBannerCTA = !!portfolioExchangeBanner?.enabled;
  const isClearCacheBannerVisible = useSelector(showClearCacheBannerSelector);

  return {
    totalAccounts,
    totalOperations,
    totalCurrencies,
    hasExchangeBannerCTA,
    shouldDisplayBorrowSection,
    shouldDisplayPerpsEntryPoint: !shouldDisplayServicesEntryPoints,
    shouldDisplayServicesEntryPoints,
    shouldDisplayBrazePlacement,
    t,
    isClearCacheBannerVisible,
  };
};

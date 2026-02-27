import { useMemo, useState } from "react";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import uniq from "lodash/uniq";
import { useTranslation } from "react-i18next";
import { Operation, AccountLike } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import { showClearCacheBannerSelector } from "~/renderer/reducers/settings";
import { useSmallValueOperationsFilter } from "~/renderer/hooks/useSmallValueOperationsFilter";

export interface PortfolioViewModelResult {
  readonly totalAccounts: number;
  readonly totalOperations: number;
  readonly totalCurrencies: number;
  readonly hasExchangeBannerCTA: boolean;
  readonly shouldDisplayMarketBanner: boolean;
  readonly shouldDisplayGraphRework: boolean;
  readonly shouldDisplayQuickActionCtas: boolean;
  readonly shouldDisplayAssetSection: boolean;
  readonly isWallet40Enabled: boolean;
  readonly filterOperations: (operation: Operation, account: AccountLike) => boolean;
  readonly isSmallValueFilterEnabled: boolean;
  readonly showHiddenSmallValueOperations: boolean;
  readonly setShowHiddenSmallValueOperations: (value: boolean) => void;
  readonly accounts: AccountLike[];
  readonly t: TFunction;
  readonly isClearCacheBannerVisible: boolean;
}

export const usePortfolioViewModel = (): PortfolioViewModelResult => {
  const accounts = useSelector(accountsSelector);
  const portfolioExchangeBanner = useFeature("portfolioExchangeBanner");
  const {
    shouldDisplayMarketBanner,
    shouldDisplayGraphRework,
    shouldDisplayQuickActionCtas,
    shouldDisplayAssetSection,
    isEnabled: isWallet40Enabled,
  } = useWalletFeaturesConfig("desktop");
  const { t } = useTranslation();
  const [showHiddenSmallValueOperations, setShowHiddenSmallValueOperations] = useState(false);
  const { filterOperations, isSmallValueFilterEnabled } = useSmallValueOperationsFilter(
    showHiddenSmallValueOperations,
  );

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
    shouldDisplayMarketBanner,
    shouldDisplayGraphRework,
    shouldDisplayQuickActionCtas,
    shouldDisplayAssetSection,
    isWallet40Enabled,
    filterOperations,
    isSmallValueFilterEnabled,
    showHiddenSmallValueOperations,
    setShowHiddenSmallValueOperations,
    accounts,
    t,
    isClearCacheBannerVisible,
  };
};

import { useCallback, useMemo } from "react";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import uniq from "lodash/uniq";
import { useTranslation } from "react-i18next";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/operation";
import { Operation, AccountLike } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import { useFilterTokenOperationsZeroAmount } from "~/renderer/actions/settings";

export interface PortfolioViewModelResult {
  readonly totalAccounts: number;
  readonly totalOperations: number;
  readonly totalCurrencies: number;
  readonly hasExchangeBannerCTA: boolean;
  readonly shouldDisplayMarketBanner: boolean;
  readonly shouldDisplayGraphRework: boolean;
  readonly shouldDisplayQuickActionCtas: boolean;
  readonly shouldDisplaySwapWebView: boolean;
  readonly filterOperations: (operation: Operation, account: AccountLike) => boolean;
  readonly accounts: AccountLike[];
  readonly t: TFunction;
}

export const usePortfolioViewModel = (): PortfolioViewModelResult => {
  const accounts = useSelector(accountsSelector);
  const portfolioExchangeBanner = useFeature("portfolioExchangeBanner");
  const { shouldDisplayMarketBanner, shouldDisplayGraphRework, shouldDisplayQuickActionCtas } =
    useWalletFeaturesConfig("desktop");
  const ptxSwapLiveAppOnPortfolio = useFeature("ptxSwapLiveAppOnPortfolio");
  const { t } = useTranslation();
  const [shouldFilterTokenOpsZeroAmount] = useFilterTokenOperationsZeroAmount();

  const filterOperations = useCallback(
    (operation: Operation, account: AccountLike) => {
      // Remove operations linked to address poisoning
      const removeZeroAmountTokenOp =
        shouldFilterTokenOpsZeroAmount && isAddressPoisoningOperation(operation, account);

      return !removeZeroAmountTokenOp;
    },
    [shouldFilterTokenOpsZeroAmount],
  );

  const totalAccounts = accounts.length;

  const totalCurrencies = useMemo(() => uniq(accounts.map(a => a.currency.id)).length, [accounts]);

  const totalOperations = useMemo(
    () => accounts.reduce((sum, a) => sum + a.operations.length, 0),
    [accounts],
  );

  const hasExchangeBannerCTA = !!portfolioExchangeBanner?.enabled;

  const shouldDisplaySwapWebView = !!ptxSwapLiveAppOnPortfolio?.enabled;

  return {
    totalAccounts,
    totalOperations,
    totalCurrencies,
    hasExchangeBannerCTA,
    shouldDisplayMarketBanner,
    shouldDisplayGraphRework,
    shouldDisplayQuickActionCtas,
    shouldDisplaySwapWebView,
    filterOperations,
    accounts,
    t,
  };
};

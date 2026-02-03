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
import { showClearCacheBannerSelector } from "~/renderer/reducers/settings";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";

export interface PortfolioViewModelResult {
  readonly totalAccounts: number;
  readonly totalOperations: number;
  readonly totalCurrencies: number;
  readonly hasExchangeBannerCTA: boolean;
  readonly shouldDisplayMarketBanner: boolean;
  readonly shouldDisplayGraphRework: boolean;
  readonly shouldDisplayQuickActionCtas: boolean;
  readonly isWallet40Enabled: boolean;
  readonly filterOperations: (operation: Operation, account: AccountLike) => boolean;
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
    isEnabled: isWallet40Enabled,
  } = useWalletFeaturesConfig("desktop");
  const { t } = useTranslation();
  const [shouldFilterTokenOpsZeroAmount] = useFilterTokenOperationsZeroAmount();
  const addressPoisoningFamilies = useAddressPoisoningOperationsFamilies({
    shouldFilter: shouldFilterTokenOpsZeroAmount,
  });

  const filterOperations = useCallback(
    (operation: Operation, account: AccountLike) => {
      const isOperationPoisoned = isAddressPoisoningOperation(
        operation,
        account,
        addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
      );

      const shouldFilterOperation = !(shouldFilterTokenOpsZeroAmount && isOperationPoisoned);

      return shouldFilterOperation;
    },
    [shouldFilterTokenOpsZeroAmount, addressPoisoningFamilies],
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
    isWallet40Enabled,
    filterOperations,
    accounts,
    t,
    isClearCacheBannerVisible,
  };
};

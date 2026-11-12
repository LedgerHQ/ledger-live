import { useCallback, useEffect } from "react";
import { shallowEqual } from "react-redux";
import { useSelector } from "~/context/hooks";
import { useFocusEffect } from "@react-navigation/native";
import useEnv from "@features/platform-env";
import { useFeature } from "@features/platform-feature-flags";
import { useServicesEntryPointsFeature } from "@features/flow-portfolio-services-entry-points";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { Features } from "@shared/feature-flags";

import { useRefreshAccountsOrderingAfterInteractions } from "~/actions/general";
import { usePortfolioBalance } from "LLM/hooks/usePortfolioBalance";
import {
  flattenAccountsSelector,
  hasNonTokenAccountsSelector,
  hasTokenAccountsNotBlacklistedSelector,
  hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
} from "~/reducers/accounts";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePortfolioAnalyticsOptInPrompt";
import { useLNUpsellBannerState } from "LLM/features/LNUpsell";
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";
import { usePostOnboardingCompletionTracking } from "~/logic/postOnboarding/usePostOnboardingCompletionTracking";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";
import storage from "LLM/storage";
import { DdRum } from "@datadog/mobile-react-native";
import { PORTFOLIO_VIEW_ID, TOP_CHAINS } from "~/utils/constants";
import { ddAddViewLoadingTime } from "LLM/utils/ddAddViewLoadingTime";
import { buildFeatureFlagTags } from "~/utils/datadogUtils";
import { ScreenName } from "~/const";

interface UsePortfolioViewModelResult {
  isAWalletCardDisplayed: boolean;
  shouldDisplayPerpsEntryPoint: boolean;
  showAssets: boolean;
  isLNUpsellBannerShown: boolean;
  backgroundColor: string;
  isSyncError: boolean;
  onBackFromUpdate: () => void;
}

const usePortfolioViewModel = (navigation: {
  goBack: () => void;
  navigate: (screen: ScreenName) => void;
}): UsePortfolioViewModelResult => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const { isAWalletCardDisplayed } = useDynamicContent();
  const { isEnabled: shouldDisplayServicesEntryPoints } = useServicesEntryPointsFeature();
  const llmDatadog = useFeature("llmDatadog");
  const allAccounts = useSelector(flattenAccountsSelector, shallowEqual);
  const { backgroundColor } = useWallet40Theme();

  const mmkvMigrationFF = useFeature("llmMmkvMigration");

  useEffect(() => {
    async function handleMigration() {
      await storage.handleMigration(mmkvMigrationFF as Features["llmMmkvMigration"]);
    }
    handleMigration();
  }, [mmkvMigrationFF]);

  const onBackFromUpdate = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useAutoRedirectToPostOnboarding();

  usePostOnboardingCompletionTracking();

  usePortfolioAnalyticsOptInPrompt();

  const refreshAccountsOrdering = useRefreshAccountsOrderingAfterInteractions();
  useFocusEffect(refreshAccountsOrdering);

  useEffect(() => {
    if (!llmDatadog?.enabled) return;
    const topChains = allAccounts.reduce<string[]>((acc, account) => {
      const currencyName = getAccountCurrency(account).name.toLowerCase();
      if (TOP_CHAINS.includes(currencyName)) acc.push(getAccountCurrency(account).name);
      return acc;
    }, []);
    DdRum.startView(
      PORTFOLIO_VIEW_ID,
      ScreenName.Portfolio,
      { topChains, featureFlags: buildFeatureFlagTags() },
      Date.now(),
    );
    ddAddViewLoadingTime();
  }, [allAccounts, llmDatadog?.enabled]);

  const hasTokenAccounts = useSelector(hasTokenAccountsNotBlacklistedSelector);
  const hasNonTokenAccounts = useSelector(hasNonTokenAccountsSelector);
  const hasTokenAccountsWithPositiveBalance = useSelector(
    hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
  );

  const showAssets =
    hasNonTokenAccounts ||
    hasTokenAccountsWithPositiveBalance ||
    (!hideEmptyTokenAccount && hasTokenAccounts);

  const isLNUpsellBannerShown = useLNUpsellBannerState("wallet").isShown;

  const { syncPhase } = usePortfolioBalance();
  const isSyncError = syncPhase === "failed";

  return {
    isAWalletCardDisplayed,
    shouldDisplayPerpsEntryPoint: !shouldDisplayServicesEntryPoints,
    showAssets,
    isLNUpsellBannerShown,
    backgroundColor,
    isSyncError,
    onBackFromUpdate,
  };
};

export default usePortfolioViewModel;

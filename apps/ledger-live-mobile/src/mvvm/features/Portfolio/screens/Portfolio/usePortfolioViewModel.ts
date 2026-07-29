import { useCallback, useEffect, useState } from "react";
import { shallowEqual } from "react-redux";
import { useSelector } from "~/context/hooks";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useSharedValue } from "react-native-reanimated";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { Features } from "@shared/feature-flags";

import { useRefreshAccountsOrderingAfterInteractions } from "~/actions/general";
import { track } from "~/analytics";
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
  hideEmptyTokenAccount: boolean;
  isAWalletCardDisplayed: boolean;
  isAccountListUIEnabled: boolean;
  shouldDisplayAssetDiscoverability: boolean;
  shouldDisplayAssetSection: boolean;
  shouldDisplayOperationsList: boolean;
  showAssets: boolean;
  isLNUpsellBannerShown: boolean;
  isAddModalOpened: boolean;
  backgroundColor: string;
  isSyncError: boolean;
  shouldAddBottomPaddingForLegacyAssets: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  handleHeightChange: (newHeight: number) => void;
  onBackFromUpdate: () => void;
}

const usePortfolioViewModel = (navigation: {
  goBack: () => void;
  navigate: (screen: ScreenName) => void;
}): UsePortfolioViewModelResult => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const { isAWalletCardDisplayed } = useDynamicContent();
  const accountListFF = useFeature("llmAccountListUI");
  const {
    shouldDisplayAssetSection,
    shouldDisplayOperationsList,
    shouldDisplayAssetDiscoverability,
  } = useWalletFeaturesConfig("mobile");
  const isAccountListUIEnabled = accountListFF?.enabled ?? false;
  const llmDatadog = useFeature("llmDatadog");
  const allAccounts = useSelector(flattenAccountsSelector, shallowEqual);
  const isFocused = useIsFocused();
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

  const openAddModal = useCallback(() => {
    track("button_clicked", {
      button: "Add Account",
    });
    setAddModalOpened(true);
  }, []);

  const closeAddModal = useCallback(() => setAddModalOpened(false), []);

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

  const animatedHeight = useSharedValue(0);

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      if (newHeight === 0 || !isFocused) return;
      animatedHeight.value = newHeight;
    },
    [animatedHeight, isFocused],
  );

  const isLNUpsellBannerShown = useLNUpsellBannerState("wallet").isShown;

  const { syncPhase } = usePortfolioBalance();
  const isSyncError = syncPhase === "failed";

  const shouldAddBottomPaddingForLegacyAssets =
    !isAWalletCardDisplayed && shouldDisplayOperationsList;

  return {
    hideEmptyTokenAccount,
    isAWalletCardDisplayed,
    isAccountListUIEnabled,
    shouldDisplayAssetDiscoverability,
    shouldDisplayAssetSection,
    shouldDisplayOperationsList,
    showAssets,
    isLNUpsellBannerShown,
    isAddModalOpened,
    backgroundColor,
    isSyncError,
    shouldAddBottomPaddingForLegacyAssets,
    openAddModal,
    closeAddModal,
    handleHeightChange,
    onBackFromUpdate,
  };
};

export default usePortfolioViewModel;

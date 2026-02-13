import { useCallback, useEffect, useState } from "react";
import { shallowEqual } from "react-redux";
import { useSelector } from "~/context/hooks";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSharedValue } from "react-native-reanimated";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { Feature_LlmMmkvMigration } from "@ledgerhq/types-live";

import { useRefreshAccountsOrdering } from "~/actions/general";
import { track } from "~/analytics";
import {
  flattenAccountsSelector,
  hasNonTokenAccountsSelector,
  hasTokenAccountsNotBlacklistedSelector,
  hasTokenAccountsNotBlackListedWithPositiveBalanceSelector,
} from "~/reducers/accounts";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePorfolioAnalyticsOptInPrompt";
import { useLNSUpsellBannerState } from "LLM/features/LNSUpsell";
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";
import { useUpdateStoreWithHidDevice } from "~/hooks/useUpdateStoreWithHidDevice";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";
import storage from "LLM/storage";
import { DdRum } from "@datadog/mobile-react-native";
import { PORTFOLIO_VIEW_ID, TOP_CHAINS } from "~/utils/constants";
import { buildFeatureFlagTags } from "~/utils/datadogUtils";
import { ScreenName } from "~/const";

interface UsePortfolioViewModelResult {
  hideEmptyTokenAccount: boolean;
  isAWalletCardDisplayed: boolean;
  isAccountListUIEnabled: boolean;
  showAssets: boolean;
  isLNSUpsellBannerShown: boolean;
  isAddModalOpened: boolean;
  shouldDisplayGraphRework: boolean;
  backgroundColor: string;
  openAddModal: () => void;
  closeAddModal: () => void;
  handleHeightChange: (newHeight: number) => void;
  onBackFromUpdate: () => void;
  goToAnalyticsAllocations: () => void;
}

const usePortfolioViewModel = (navigation: {
  goBack: () => void;
  navigate: (screen: ScreenName) => void;
}): UsePortfolioViewModelResult => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const { isAWalletCardDisplayed } = useDynamicContent();
  const accountListFF = useFeature("llmAccountListUI");
  const { shouldDisplayGraphRework } = useWalletFeaturesConfig("mobile");
  const isAccountListUIEnabled = accountListFF?.enabled ?? false;
  const llmDatadog = useFeature("llmDatadog");
  const allAccounts = useSelector(flattenAccountsSelector, shallowEqual);
  useUpdateStoreWithHidDevice();
  const isFocused = useIsFocused();
  const { backgroundColor } = useWallet40Theme("mobile");

  const mmkvMigrationFF = useFeature("llmMmkvMigration");

  useEffect(() => {
    async function handleMigration() {
      await storage.handleMigration(mmkvMigrationFF as Feature_LlmMmkvMigration);
    }
    handleMigration();
  }, [mmkvMigrationFF]);

  const onBackFromUpdate = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useAutoRedirectToPostOnboarding();

  usePortfolioAnalyticsOptInPrompt();

  const openAddModal = useCallback(() => {
    track("button_clicked", {
      button: "Add Account",
    });
    setAddModalOpened(true);
  }, []);

  const closeAddModal = useCallback(() => setAddModalOpened(false), []);
  const refreshAccountsOrdering = useRefreshAccountsOrdering();
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
    DdRum.addViewLoadingTime(true);
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

  const isLNSUpsellBannerShown = useLNSUpsellBannerState("wallet").isShown;

  const goToAnalyticsAllocations = useCallback(() => {
    navigation.navigate(ScreenName.AnalyticsAllocation);
  }, [navigation]);

  return {
    hideEmptyTokenAccount,
    isAWalletCardDisplayed,
    isAccountListUIEnabled,
    showAssets,
    isLNSUpsellBannerShown,
    isAddModalOpened,
    shouldDisplayGraphRework,
    backgroundColor,
    openAddModal,
    closeAddModal,
    handleHeightChange,
    onBackFromUpdate,
    goToAnalyticsAllocations,
  };
};

export default usePortfolioViewModel;

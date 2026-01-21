import { useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual } from "react-redux";
import { useSelector } from "~/context/hooks";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
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
import { useListenToHidDevices } from "~/hooks/useListenToHidDevices";
import storage from "LLM/storage";
import { DdRum } from "@datadog/mobile-react-native";
import { PORTFOLIO_VIEW_ID, TOP_CHAINS } from "~/utils/constants";
import { buildFeatureFlagTags } from "~/utils/datadogUtils";
import { ScreenName } from "~/const";

interface UsePortfolioViewModelResult {
  hideEmptyTokenAccount: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  isAWalletCardDisplayed: boolean;
  isAccountListUIEnabled: boolean;
  showAssets: boolean;
  isLNSUpsellBannerShown: boolean;
  isAddModalOpened: boolean;
  isFocused: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  openAddModal: () => void;
  closeAddModal: () => void;
  handleHeightChange: (newHeight: number) => void;
  onBackFromUpdate: () => void;
  goToAnalyticsAllocations: () => void;
  progressViewOffset: number;
}

const usePortfolioViewModel = (navigation: {
  goBack: () => void;
  navigate: (screen: ScreenName) => void;
}): UsePortfolioViewModelResult => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const { t } = useTranslation();
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const { colors } = useTheme();
  const { isAWalletCardDisplayed } = useDynamicContent();
  const accountListFF = useFeature("llmAccountListUI");
  const isAccountListUIEnabled = accountListFF?.enabled ?? false;
  const llmDatadog = useFeature("llmDatadog");
  const allAccounts = useSelector(flattenAccountsSelector, shallowEqual);
  useListenToHidDevices();
  const isFocused = useIsFocused();

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

  const progressViewOffset = useMemo(() => (Platform.OS === "android" ? 64 : 0), []);

  return {
    hideEmptyTokenAccount,
    colors,
    isAWalletCardDisplayed,
    isAccountListUIEnabled,
    showAssets,
    isLNSUpsellBannerShown,
    isAddModalOpened,
    isFocused,
    t,
    openAddModal,
    closeAddModal,
    handleHeightChange,
    onBackFromUpdate,
    goToAnalyticsAllocations,
    progressViewOffset,
  };
};

export default usePortfolioViewModel;

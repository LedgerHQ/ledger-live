import { useCallback, useContext } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRefreshAccountsOrderingAfterInteractions } from "~/actions/general";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePortfolioAnalyticsOptInPrompt";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import { useLNSUpsellBannerState } from "LLM/features/LNSUpsell";

interface UseReadOnlyPortfolioViewModelResult {
  safeAreaTop: number;
  shouldDisplayGraphRework: boolean;
  shouldDisplayWallet40MainNav: boolean;
  isLNSUpsellBannerShown: boolean;
  source: string | undefined;
  onBackFromUpdate: () => void;
}

const useReadOnlyPortfolioViewModel = (navigation: {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
}): UseReadOnlyPortfolioViewModelResult => {
  const { shouldDisplayGraphRework, shouldDisplayWallet40MainNav } =
    useWalletFeaturesConfig("mobile");
  const { top: safeAreaTop } = useSafeAreaInsets();
  const isLNSUpsellBannerShown = useLNSUpsellBannerState("wallet").isShown;

  usePortfolioAnalyticsOptInPrompt();

  const refreshAccountsOrdering = useRefreshAccountsOrderingAfterInteractions();
  useFocusEffect(refreshAccountsOrdering);

  const onBackFromUpdate = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const { source, setSource, setScreen } = useContext(AnalyticsContext);

  const focusEffect = useCallback(() => {
    setScreen?.("Wallet");
    return () => setSource("Wallet");
  }, [setSource, setScreen]);

  useFocusEffect(focusEffect);

  return {
    safeAreaTop,
    shouldDisplayGraphRework,
    shouldDisplayWallet40MainNav,
    isLNSUpsellBannerShown,
    source,
    onBackFromUpdate,
  };
};

export default useReadOnlyPortfolioViewModel;

import { useCallback, useContext } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAdjustedSafeAreaInsets } from "LLM/hooks/useNavigationBarHeights";

import { useRefreshAccountsOrderingAfterInteractions } from "~/actions/general";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePortfolioAnalyticsOptInPrompt";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import { useLNSUpsellBannerState } from "LLM/features/LNSUpsell";

interface UseReadOnlyPortfolioViewModelResult {
  safeAreaTop: number;
  isLNSUpsellBannerShown: boolean;
  source: string | undefined;
  onBackFromUpdate: () => void;
}

const useReadOnlyPortfolioViewModel = (navigation: {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
}): UseReadOnlyPortfolioViewModelResult => {
  const { top: safeAreaTop } = useAdjustedSafeAreaInsets();
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
    isLNSUpsellBannerShown,
    source,
    onBackFromUpdate,
  };
};

export default useReadOnlyPortfolioViewModel;

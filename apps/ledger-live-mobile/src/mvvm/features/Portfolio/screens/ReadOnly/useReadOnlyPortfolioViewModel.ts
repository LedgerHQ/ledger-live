import { useCallback, useContext, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { useRefreshAccountsOrdering } from "~/actions/general";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePorfolioAnalyticsOptInPrompt";
import { useReadOnlyCoins } from "~/hooks/useReadOnlyCoins";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { useLNSUpsellBannerState } from "LLM/features/LNSUpsell";

const MAX_ASSETS_TO_DISPLAY = 5;

interface UseReadOnlyPortfolioViewModelResult {
  assets: Asset[];
  shouldDisplayGraphRework: boolean;
  isLNSUpsellBannerShown: boolean;
  source: string | undefined;
  goToAssets: () => void;
  onBackFromUpdate: () => void;
}

const useReadOnlyPortfolioViewModel = (navigation: {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
}): UseReadOnlyPortfolioViewModelResult => {
  const { shouldDisplayGraphRework } = useWalletFeaturesConfig("mobile");
  const isLNSUpsellBannerShown = useLNSUpsellBannerState("wallet").isShown;

  const { sortedCryptoCurrencies } = useReadOnlyCoins({ maxDisplayed: MAX_ASSETS_TO_DISPLAY });

  const assets: Asset[] = useMemo(
    () =>
      sortedCryptoCurrencies?.map(currency => ({
        amount: 0,
        accounts: [],
        currency,
      })),
    [sortedCryptoCurrencies],
  );

  usePortfolioAnalyticsOptInPrompt();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const goToAssets = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.Assets,
    });
  }, [navigation]);

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
    assets,
    shouldDisplayGraphRework,
    isLNSUpsellBannerShown,
    source,
    goToAssets,
    onBackFromUpdate,
  };
};

export default useReadOnlyPortfolioViewModel;

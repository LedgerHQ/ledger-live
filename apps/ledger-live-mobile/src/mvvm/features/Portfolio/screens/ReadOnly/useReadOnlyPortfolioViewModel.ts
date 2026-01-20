import { useCallback, useContext, useMemo, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { Currency } from "@ledgerhq/types-cryptoassets";

import { useRefreshAccountsOrdering } from "~/actions/general";
import { counterValueCurrencySelector, hasOrderedNanoSelector } from "~/reducers/settings";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import usePortfolioAnalyticsOptInPrompt from "~/hooks/analyticsOptInPrompt/usePorfolioAnalyticsOptInPrompt";
import { useReadOnlyCoins } from "~/hooks/useReadOnlyCoins";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";

const MAX_ASSETS_TO_DISPLAY = 5;

interface UseReadOnlyPortfolioViewModelResult {
  counterValueCurrency: Currency;
  portfolio: ReturnType<typeof usePortfolioAllAccounts>;
  colors: ReturnType<typeof useTheme>["colors"];
  hasOrderedNano: boolean;
  assets: Asset[];
  graphCardEndPosition: number;
  currentPositionY: ReturnType<typeof useSharedValue<number>>;
  t: ReturnType<typeof useTranslation>["t"];
  source: string | undefined;
  onPortfolioCardLayout: (event: LayoutChangeEvent) => void;
  goToAssets: () => void;
  onBackFromUpdate: () => void;
}

const useReadOnlyPortfolioViewModel = (navigation: {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
}): UseReadOnlyPortfolioViewModelResult => {
  const { t } = useTranslation();
  const counterValueCurrency: Currency = useSelector(counterValueCurrencySelector);
  const portfolio = usePortfolioAllAccounts();
  const { colors } = useTheme();
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

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

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
  const currentPositionY = useSharedValue(0);

  const onPortfolioCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

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
    setScreen && setScreen("Wallet");
    return () => setSource("Wallet");
  }, [setSource, setScreen]);

  useFocusEffect(focusEffect);

  return {
    counterValueCurrency,
    portfolio,
    colors,
    hasOrderedNano,
    assets,
    graphCardEndPosition,
    currentPositionY,
    t,
    source,
    onPortfolioCardLayout,
    goToAssets,
    onBackFromUpdate,
  };
};

export default useReadOnlyPortfolioViewModel;

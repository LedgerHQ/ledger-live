import { useCallback, useMemo } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import {
  MAX_ASSETS_TO_DISPLAY,
  MAX_STABLECOINS_TO_DISPLAY,
} from "LLM/features/WalletAssets/constants";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";

interface WalletAssetsViewModelResult {
  hasMore: boolean;
  onPressShowAll: () => void;
  shouldAddBottomPadding: boolean;
  shouldDisplayAssetSection: boolean;
}

export function useWalletAssetsViewModel(): WalletAssetsViewModelResult {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const onPressShowAll = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, { screen: ScreenName.Assets });
  }, [navigation]);
  const { categorizedAssets } = useCategorizedAssetsFromPortfolio();
  const { shouldDisplayOperationsList, shouldDisplayAssetSection } =
    useWalletFeaturesConfig("mobile");

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const hasMore = useMemo(() => {
    const isVisible = ({ currency }: { currency: { type: string; id: string } }) =>
      currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id);

    const cryptosCount = categorizedAssets.cryptos.filter(isVisible).length;
    const stablecoinsCount = categorizedAssets.stablecoins.filter(isVisible).length;

    return cryptosCount > MAX_ASSETS_TO_DISPLAY || stablecoinsCount > MAX_STABLECOINS_TO_DISPLAY;
  }, [categorizedAssets, blacklistedTokenIdsSet]);

  // When the operations list section is hidden, WalletAssetsView is the last section and
  // the tab bar (rendered without safe area) would overlap the bottom content.
  return {
    hasMore,
    onPressShowAll,
    shouldAddBottomPadding: shouldDisplayOperationsList,
    shouldDisplayAssetSection,
  };
}

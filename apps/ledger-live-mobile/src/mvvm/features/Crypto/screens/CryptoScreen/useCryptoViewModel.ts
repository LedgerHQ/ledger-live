import { useCallback, useMemo } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { NavigatorName, ScreenName } from "~/const";
import { Asset } from "~/types/asset";
import { track } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { useCategorizedAssetsFromPortfolio } from "LLM/hooks/useCategorizedAssetsFromPortfolio";
import { toAsset } from "LLM/utils/assetUtils";
import { CryptoScreenViewData, CryptoVariant } from "./types";
import { selectAssetList } from "./utils";

type NavigationProp = BaseNavigationComposite<
  StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.Crypto>
>;

interface UseCryptoViewModelParams {
  sourceScreenName?: ScreenName;
  variant?: CryptoVariant;
}

const TRACKING_TYPE_BY_VARIANT: Record<CryptoVariant, "crypto" | "stable" | undefined> = {
  stablecoin: "stable",
  crypto: "crypto",
  all: undefined,
};

const useCryptoViewModel = ({
  sourceScreenName,
  variant,
}: UseCryptoViewModelParams): CryptoScreenViewData => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const { categorizedAssets, isLoadingStablecoinTickers, isStablecoinTickersError } =
    useCategorizedAssetsFromPortfolio();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const resolvedVariant: CryptoVariant = variant ?? "all";

  const assetsToDisplay = useMemo(
    (): Asset[] => selectAssetList(categorizedAssets, resolvedVariant).map(toAsset),
    [categorizedAssets, resolvedVariant],
  );

  const onItemPress = useCallback(
    (asset: Asset) => {
      track("asset_clicked", {
        asset: asset.currency.name,
        page: TRACKING_TYPE_BY_VARIANT[resolvedVariant],
      });

      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: {
          currency: asset.currency,
        },
      });
    },
    [navigation, resolvedVariant],
  );

  const trackingType = TRACKING_TYPE_BY_VARIANT[resolvedVariant];

  return {
    assetsToDisplay,
    onItemPress,
    isLoading: isLoadingStablecoinTickers,
    error: isStablecoinTickersError ? new Error(t("crypto.errorState")) : null,
    sourceScreenName,
    variant: resolvedVariant,
    trackingType,
  };
};

export default useCryptoViewModel;

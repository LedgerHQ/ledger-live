import { useCallback, useMemo } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { useRefreshAccountsOrdering } from "~/actions/general";
import { NavigatorName, ScreenName } from "~/const";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { hasNoAccountsSelector } from "~/reducers/accounts";
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
import { CryptoVariant } from "./types";
import { selectAssetList } from "./utils";

type NavigationProp = BaseNavigationComposite<
  StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.Crypto>
>;

interface UseCryptoViewModelParams {
  sourceScreenName?: ScreenName;
  variant?: CryptoVariant;
}

const TRACKING_PAGE_BY_VARIANT: Record<CryptoVariant, string> = {
  stablecoin: "Stablecoin",
  crypto: "Crypto",
  all: "AllAssets",
};

const useCryptoViewModel = ({ sourceScreenName, variant }: UseCryptoViewModelParams) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const hasNoAccount = useSelector(hasNoAccountsSelector);

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const { categorizedAssets, isLoadingStablecoinTickers } = useCategorizedAssetsFromPortfolio();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const resolvedVariant: CryptoVariant = variant ?? "all";

  const assetsToDisplay = useMemo((): Asset[] => {
    const list = selectAssetList(categorizedAssets, resolvedVariant);

    return list
      .filter(
        ({ currency }) =>
          currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id),
      )
      .map(toAsset);
  }, [categorizedAssets, resolvedVariant, blacklistedTokenIdsSet]);

  const onItemPress = useCallback(
    (asset: Asset) => {
      track("asset_clicked", {
        asset: asset.currency.name,
        page: TRACKING_PAGE_BY_VARIANT[resolvedVariant],
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

  const title = resolvedVariant === "stablecoin" ? t("crypto.stablecoinTitle") : t("crypto.title");
  const screenTrackingName = TRACKING_PAGE_BY_VARIANT[resolvedVariant];

  return {
    assetsToDisplay,
    onItemPress,
    hasNoAccount,
    isLoading: isLoadingStablecoinTickers,
    sourceScreenName,
    onNavigateBack: navigation.goBack,
    variant: resolvedVariant,
    title,
    screenTrackingName,
  };
};

export default useCryptoViewModel;

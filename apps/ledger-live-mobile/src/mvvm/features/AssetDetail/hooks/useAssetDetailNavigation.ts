import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";

type Navigation = NativeStackNavigationProp<BaseNavigatorStackParamList>;

type OpenFromAssetParams = Readonly<{
  currency: CryptoOrTokenCurrency;
  source: string;
  isPlaceholder?: boolean;
  marketId?: string;
}>;

type OpenFromMarketParams = Readonly<{
  marketCurrencyId: string;
  ledgerCurrencyIds?: string[];
  source: string;
}>;

/**
 * Navigation into Asset Detail from a portfolio row (`openFromAsset`) or a market
 * row (`openFromMarket`). A `marketId` is forwarded as `marketState` so assets
 * whose ledger id differs from the market id still hit the market API.
 */
export function useAssetDetailNavigation() {
  const navigation = useNavigation<Navigation>();

  const openFromAsset = useCallback(
    ({ currency, source, marketId }: OpenFromAssetParams) => {
      navigation.navigate(NavigatorName.AssetDetail, {
        screen: ScreenName.AssetDetail,
        params: {
          currencyId: currency.id,
          source,
          ...(marketId && { marketState: { id: marketId, ledgerIds: [currency.id] } }),
        },
      });
    },
    [navigation],
  );

  const openFromMarket = useCallback(
    ({ marketCurrencyId, ledgerCurrencyIds, source }: OpenFromMarketParams) => {
      navigation.navigate(NavigatorName.AssetDetail, {
        screen: ScreenName.AssetDetail,
        params: {
          currencyId: marketCurrencyId,
          source,
          marketState: { id: marketCurrencyId, ledgerIds: ledgerCurrencyIds },
        },
      });
    },
    [navigation],
  );

  return {
    openFromAsset,
    openFromMarket,
    hideNetwork: true,
  };
}

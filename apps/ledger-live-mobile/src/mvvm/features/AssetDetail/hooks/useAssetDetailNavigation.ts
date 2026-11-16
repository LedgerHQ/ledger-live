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
  marketId?: string;
}>;

type OpenFromMarketParams = Readonly<{
  marketCurrencyId: string;
  ledgerCurrencyIds?: string[];
  source: string;
}>;

/**
 * Opens Asset Detail from a portfolio row or a market row.
 * `marketId` is forwarded as `marketState` so assets whose ledger id differs
 * from the market id (for example BNB) resolve the market API correctly.
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

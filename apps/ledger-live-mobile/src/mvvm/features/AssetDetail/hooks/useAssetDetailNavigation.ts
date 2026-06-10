import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
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
 * Centralised navigation helper for the AssetDetail flow.
 *
 * `aggregatedAssets` (from `lwmWallet40`) decides the destination:
 *   - **enabled**  → the new MVVM `AssetDetail` screen.
 *   - **disabled** → the legacy `MarketDetail` (for placeholder / market entries)
 *                    or `Accounts > Asset` (for in-wallet assets).
 *
 * Two entry-point modes:
 *   - `openFromAsset`  — tap on a portfolio / asset list row. Carries the
 *                        ledger currency, source, and optional placeholder info
 *                        so the legacy fallback can still resolve a market id.
 *   - `openFromMarket` — tap on a market row / tile. Carries the market id and
 *                        any known ledger ids. When the flag is on we also
 *                        forward a `marketState` hint so the AssetDetail screen
 *                        can resolve the distribution item via `bySlug` and the
 *                        market API via the correct id (fixes BNB-style
 *                        ledger-id ≠ market-id mismatches).
 *
 * Also exposes `hideNetwork = shouldDisplayAggregatedAssets` so call sites
 * don't have to re-read `useWalletFeaturesConfig` for the icon-related rule.
 */
export function useAssetDetailNavigation() {
  const navigation = useNavigation<Navigation>();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("mobile");

  const openFromAsset = useCallback(
    ({ currency, source, isPlaceholder, marketId }: OpenFromAssetParams) => {
      if (shouldDisplayAggregatedAssets) {
        navigation.navigate(NavigatorName.AssetDetail, {
          screen: ScreenName.AssetDetail,
          params: {
            currencyId: currency.id,
            source,
            // Thread `marketId` via `marketState` so `resolveAssetMarketInputs`
            // resolves the market API id correctly for assets whose ledger id
            // differs from the market id (e.g. BNB: "bsc" vs "binancecoin").
            ...(marketId && { marketState: { id: marketId, ledgerIds: [currency.id] } }),
          },
        });
        return;
      }
      if (isPlaceholder) {
        navigation.navigate(ScreenName.MarketDetail, {
          currencyId: dadaIdToMarketId(marketId ?? currency.id),
        });
        return;
      }
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: { currency },
      });
    },
    [navigation, shouldDisplayAggregatedAssets],
  );

  const openFromMarket = useCallback(
    ({ marketCurrencyId, ledgerCurrencyIds, source }: OpenFromMarketParams) => {
      if (shouldDisplayAggregatedAssets) {
        navigation.navigate(NavigatorName.AssetDetail, {
          screen: ScreenName.AssetDetail,
          params: {
            currencyId: marketCurrencyId,
            source,
            marketState: { id: marketCurrencyId, ledgerIds: ledgerCurrencyIds },
          },
        });
        return;
      }
      navigation.navigate(ScreenName.MarketDetail, {
        currencyId: marketCurrencyId,
      });
    },
    [navigation, shouldDisplayAggregatedAssets],
  );

  return {
    openFromAsset,
    openFromMarket,
    hideNetwork: shouldDisplayAggregatedAssets,
  };
}

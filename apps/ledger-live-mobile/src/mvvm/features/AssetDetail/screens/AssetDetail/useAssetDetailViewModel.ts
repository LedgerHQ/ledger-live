import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrencyById } from "@ledgerhq/cryptoassets/hooks";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFeature } from "@features/platform-feature-flags";
import { useNavigation, useRoute, StackActions } from "@react-navigation/native";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useDistribution } from "~/actions/general";
import {
  resolveAssetMarketInputs,
  resolveDistributionItem,
} from "@ledgerhq/asset-aggregation/assetDistribution/index";
import type { AssetDetailNavigatorParamsList } from "../../types";
import { useAssetActionsAvailability } from "./components/Footer/useFooterViewModel";
import { useAssetCoinOptionsViewModel } from "./components/CoinOptions/useAssetCoinOptionsViewModel";
import { useAssetMarketData } from "./hooks/useAssetMarketData";
import { useReceiveNetworkLedgerIds } from "./hooks/useReceiveNetworkLedgerIds";
import { isRobinhoodExclusiveAsset } from "./utils/isRobinhoodExclusiveAsset";

type Route = StackNavigatorProps<AssetDetailNavigatorParamsList, ScreenName.AssetDetail>["route"];
type Navigation = StackNavigatorProps<
  AssetDetailNavigatorParamsList,
  ScreenName.AssetDetail
>["navigation"];

export type AssetDetailMode = "loading" | "ready" | "not-found";

export function resolveAssetDetailMode({
  hasCurrency,
  isDistributionLoading,
  isMarketLoading,
}: {
  hasCurrency: boolean;
  isDistributionLoading: boolean;
  isMarketLoading: boolean;
}): AssetDetailMode {
  if (hasCurrency) return "ready";
  if (isDistributionLoading || isMarketLoading) return "loading";
  return "not-found";
}

export function useAssetDetailViewModel() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const { currencyId, source, marketState } = route.params;

  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const distribution = useDistribution({
    groupBy: "asset",
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });
  const distributionItem = useMemo(
    () => resolveDistributionItem({ routeAssetId: currencyId, marketState, distribution }),
    [currencyId, marketState, distribution],
  );

  const ledgerIdFallback = marketState?.ledgerIds?.[0] ?? currencyId;
  const { currency: ledgerCurrencyById } = useCurrencyById(ledgerIdFallback);
  const currencyFromRegistry = distributionItem?.currency ?? ledgerCurrencyById;

  const { marketApiId, knownLedgerIds, knownMarketId } = useMemo(
    () =>
      resolveAssetMarketInputs({
        distributionItem,
        marketState,
        currency: currencyFromRegistry,
        fallbackId: currencyId,
      }),
    [distributionItem, marketState, currencyFromRegistry, currencyId],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  const {
    marketId,
    ledgerIds,
    marketCurrency,
    ledgerCurrencyFromDada,
    isLoading: isMarketLoading,
  } = useAssetMarketData({
    marketApiId,
    knownLedgerIds,
    knownMarketId,
  });

  const currency = currencyFromRegistry ?? ledgerCurrencyFromDada;

  const isLoading = distribution.isLoading;

  const mode = resolveAssetDetailMode({
    hasCurrency: Boolean(currency),
    isDistributionLoading: isLoading,
    isMarketLoading,
  });

  useEffect(() => {
    if (mode === "not-found") {
      navigation.getParent()?.dispatch(StackActions.replace(ScreenName.MarketList));
    }
  }, [mode, navigation]);

  // Tokens (e.g. USDT/USDC) collapse to a single ledger id here because CoinGecko
  // does not expose their multi-network list. Expand it from DADA so the receive
  // drawer can offer every network, including ones not held yet. The market ticker
  // is the fallback for not-held assets, where `currency` may be unresolved.
  const receiveLedgerIds = useReceiveNetworkLedgerIds({
    metaCurrencyId: distributionItem?.metaCurrencyId,
    marketApiId,
    ticker: currency?.ticker ?? marketCurrency?.ticker,
    currencyId: currency?.id,
    fallbackLedgerIds: ledgerIds,
  });
  const { isBuyAvailable, availableOnSwap, isCurrencySupported, secondaryButton } =
    useAssetActionsAvailability(currency, receiveLedgerIds);
  const hasFooter = isBuyAvailable || secondaryButton !== null;
  const hideReceiveInBalanceGraph = !isCurrencySupported || secondaryButton === "receive";
  const showFallbackBanner = isCurrencySupported && !isBuyAvailable && !availableOnSwap;
  const robinhoodDisclaimer = useFeature("llRobinhoodDisclaimer");
  const hasPositiveBalance = (distributionItem?.amount ?? 0) > 0;
  const showStockDisclaimerBanner =
    !!robinhoodDisclaimer?.enabled &&
    hasPositiveBalance &&
    isRobinhoodExclusiveAsset(receiveLedgerIds);

  const coinOptions = useAssetCoinOptionsViewModel({ currency, currencyId, marketId });

  return {
    mode,
    currency,
    distributionItem,
    marketApiId,
    knownLedgerIds,
    knownMarketId,
    source,
    isRefreshing,
    onRefresh,
    hasFooter,
    hideReceiveInBalanceGraph,
    showFallbackBanner,
    showStockDisclaimerBanner,
    coinOptions,
    isLoading,
    ledgerIds: receiveLedgerIds,
  };
}

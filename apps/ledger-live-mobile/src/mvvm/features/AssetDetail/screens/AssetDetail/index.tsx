import React, { useEffect, useLayoutEffect } from "react";
import type { NativeStackHeaderRightProps } from "@react-navigation/native-stack";
import { useNavigation, StackActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CurrencyIcon from "~/components/CurrencyIcon";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { AssetDetailNavigatorParamsList } from "LLM/features/AssetDetail/types";
import { ScreenName } from "~/const";
import { ASSET_DETAIL_TEST_IDS } from "../../testIds";
import { useAssetDetailViewModel } from "./useAssetDetailViewModel";
import { AssetDetailView } from "./AssetDetailView";
import { AssetDetailLoading } from "./components/AssetDetailFallback";
import { AssetCoinOptionsTrailing } from "./components/CoinOptions/AssetCoinOptionsTrailing";

type NavigationProps = NativeStackNavigationProp<
  AssetDetailNavigatorParamsList,
  ScreenName.AssetDetail
>;

export default function AssetDetail() {
  const viewModel = useAssetDetailViewModel();
  const { currency, coinOptions, mode } = viewModel;
  const navigation = useNavigation<NavigationProps>();

  useLayoutEffect(() => {
    if (!currency) return;

    function renderTrailing(_props: NativeStackHeaderRightProps) {
      return (
        <AssetCoinOptionsTrailing
          onPress={coinOptions.openCoinOptions}
          accessibilityLabel={coinOptions.trailingAccessibilityLabel}
          testID={ASSET_DETAIL_TEST_IDS.coinOptionsTrailing}
        />
      );
    }

    const opts: Partial<LumenNativeStackNavigationOptions> = {
      lumenNavBar: {
        coinCapsule: {
          ticker: currency.ticker,
          leadingContent: <CurrencyIcon currency={currency} hideNetwork size={24} />,
        },
        renderTrailing,
        navBarTrailingProps: {
          style: { marginRight: 16 },
        },
      },
    };
    navigation.setOptions(opts);
  }, [navigation, currency, coinOptions.openCoinOptions, coinOptions.trailingAccessibilityLabel]);

  // A deeplinked asset that resolves to nothing (e.g. an invalid term) redirects to the generic
  // Market list, replacing the unresolved Asset Detail entry so Back doesn't return to it. The
  // mode is only "not-found" once resolution has settled, so this never fires mid-load.
  useEffect(() => {
    if (mode !== "not-found") return;
    navigation.getParent()?.dispatch(StackActions.replace(ScreenName.MarketList));
  }, [mode, navigation]);

  if (mode === "loading") return <AssetDetailLoading />;
  // Render nothing while the not-found redirect above takes effect.
  if (mode === "not-found") return null;

  return <AssetDetailView {...viewModel} />;
}

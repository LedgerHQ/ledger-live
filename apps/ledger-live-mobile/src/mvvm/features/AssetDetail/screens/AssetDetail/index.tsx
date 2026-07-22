import React, { useEffect, useLayoutEffect } from "react";
import type { NativeStackHeaderRightProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CurrencyIcon from "~/components/CurrencyIcon";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { AssetDetailNavigatorParamsList } from "LLM/features/AssetDetail/types";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import { ASSET_DETAIL_TEST_IDS } from "../../testIds";
import { useAssetDetailViewModel } from "./useAssetDetailViewModel";
import { AssetDetailView } from "./AssetDetailView";
import { AssetCoinOptionsTrailing } from "./components/CoinOptions/AssetCoinOptionsTrailing";

type BaseNavigatorNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

type NavigationProps = CompositeNavigationProp<
  NativeStackNavigationProp<AssetDetailNavigatorParamsList, ScreenName.AssetDetail>,
  BaseNavigatorNavigation
>;

export default function AssetDetail() {
  const viewModel = useAssetDetailViewModel();
  const { currency, coinOptions, shouldRedirectToMarket } = viewModel;
  const navigation = useNavigation<NavigationProps>();

  useEffect(() => {
    if (!shouldRedirectToMarket) return;

    const baseNavigation = navigation.getParent<BaseNavigatorNavigation>(BASE_NAVIGATOR_ID);
    if (baseNavigation) {
      baseNavigation.replace(ScreenName.MarketList);
      return;
    }

    navigation.navigate(ScreenName.MarketList);
  }, [navigation, shouldRedirectToMarket]);

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
          leadingContent: (
            <CurrencyIcon
              currency={currency}
              hideNetwork
              size={24}
              testID={`${ASSET_DETAIL_TEST_IDS.coinCapsuleIcon}-${currency.ticker}`}
            />
          ),
          testID: ASSET_DETAIL_TEST_IDS.coinCapsule,
        },
        renderTrailing,
        navBarTrailingProps: {
          style: { marginRight: 16 },
        },
      },
    };
    navigation.setOptions(opts);
  }, [navigation, currency, coinOptions.openCoinOptions, coinOptions.trailingAccessibilityLabel]);

  if (shouldRedirectToMarket) return null;

  return <AssetDetailView {...viewModel} />;
}

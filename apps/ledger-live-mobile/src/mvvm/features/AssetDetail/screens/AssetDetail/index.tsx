import React, { useLayoutEffect } from "react";
import type { NativeStackHeaderRightProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CurrencyIcon from "~/components/CurrencyIcon";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { AssetDetailNavigatorParamsList } from "LLM/features/AssetDetail/types";
import { ScreenName } from "~/const";
import { ASSET_DETAIL_TEST_IDS } from "../../testIds";
import { useAssetDetailViewModel } from "./useAssetDetailViewModel";
import { AssetDetailView } from "./AssetDetailView";
import { AssetCoinOptionsTrailing } from "./components/CoinOptions/AssetCoinOptionsTrailing";

type NavigationProps = NativeStackNavigationProp<
  AssetDetailNavigatorParamsList,
  ScreenName.AssetDetail
>;

export default function AssetDetail() {
  const viewModel = useAssetDetailViewModel();
  const { currency, coinOptions } = viewModel;
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
          ticker: currency.name,
          icon: <CurrencyIcon currency={currency} hideNetwork size={24} />,
        },
        renderTrailing,
        navBarTrailingProps: {
          style: { marginRight: 16 },
        },
      },
    };
    navigation.setOptions(opts);
  }, [navigation, currency, coinOptions.openCoinOptions, coinOptions.trailingAccessibilityLabel]);

  return <AssetDetailView {...viewModel} />;
}
